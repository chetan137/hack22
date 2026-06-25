"""
ECOSENSE AI — OCR Service

Uses Gemini 2.5 Flash Vision as the primary extraction method.
EasyOCR is a last-resort fallback only when Gemini is completely unavailable.
"""

import re
import os
import uuid
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Optional

from app.core.config import settings

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# EasyOCR is imported lazily — only used as absolute last resort
_reader = None

def _get_reader():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(['en', 'hi', 'mr'], gpu=False, verbose=False)
    return _reader

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ---------- Gemini Vision (Primary - Fast Path) ----------

def _call_gemini_vision_sync(image_path: str) -> Optional[dict]:
    """
    Synchronous Gemini Vision call — run inside asyncio.to_thread() to avoid
    blocking the event loop. This is the PRIMARY extraction method.
    """
    gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not gemini_key:
        print("[OCR] GEMINI_API_KEY is not set — skipping Gemini Vision")
        return None

    try:
        import google.genai as genai
        import PIL.Image

        print(f"[OCR] Stage 1: Calling Gemini Vision on {image_path}")
        t0 = time.time()

        client = genai.Client(api_key=gemini_key)
        full_path = str(UPLOAD_DIR / image_path)
        img = PIL.Image.open(full_path)

        prompt = (
            "You are an expert document parser specializing in utility bills. "
            "Analyze this bill image carefully and extract the following structured information.\n\n"
            "STRICT RULES:\n"
            "1. Extract ONLY values explicitly visible in the image. Support multiple languages including English, Marathi, Hindi.\n"
            "2. Do NOT guess, infer, estimate, or calculate any value.\n"
            "3. Preserve exact values as printed on the bill. For dates, ensure they are realistic (e.g. valid month <= 12).\n"
            "4. If a field is not visible, return null.\n"
            "5. For units_consumed: use fields indicating usage like 'Units Consumed', 'Consumption', 'वापर' (vaapar), or 'युनिट'. Do NOT use Present Reading or Past Reading.\n"
            "6. For amounts: if multiple exist (Due Amount, After Due Date, देय रक्कम), map the primary bill amount to due_amount.\n"
            "7. Return ONLY valid JSON with no markdown, no code fences, no explanation.\n\n"
            "Return exactly this JSON:\n"
            "{\n"
            '  "bill_type": "Electricity",\n'
            '  "provider": "",\n'
            '  "bill_month": "",\n'
            '  "bill_date": "",\n'
            '  "due_date": "",\n'
            '  "consumer_name": "",\n'
            '  "service_number": "",\n'
            '  "meter_number": "",\n'
            '  "units_consumed": {"value": null, "unit": "kWh"},\n'
            '  "amount": {"discount_amount": null, "due_amount": null, "after_due_amount": null},\n'
            '  "confidence": 0.0\n'
            "}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, img],
        )

        elapsed = time.time() - t0
        print(f"[OCR] Stage 1: Gemini responded in {elapsed:.1f}s")

        # Stage 2: Print raw response
        raw = response.text.strip()
        print(f"[OCR] Stage 2 RAW GEMINI RESPONSE:\n{raw[:500]}")

        # Strip markdown fences if present
        if raw.startswith("```json"):
            raw = raw[7:]
            if "```" in raw:
                raw = raw[:raw.rfind("```")]
            raw = raw.strip()
        elif raw.startswith("```"):
            raw = raw[3:]
            if "```" in raw:
                raw = raw[:raw.rfind("```")]
            raw = raw.strip()

        # Stage 3: Parse JSON
        parsed = json.loads(raw)
        print(f"[OCR] Stage 3 PARSED JSON: bill_type={parsed.get('bill_type')}, "
              f"units_consumed={parsed.get('units_consumed')}, "
              f"amount={parsed.get('amount')}, "
              f"bill_date={parsed.get('bill_date')}, "
              f"due_date={parsed.get('due_date')}, "
              f"confidence={parsed.get('confidence')}")

        return parsed

    except json.JSONDecodeError as e:
        print(f"[OCR] Stage 3 JSON parse failed: {e}")
        return None
    except Exception as e:
        print(f"[OCR] Gemini Vision error: {type(e).__name__}: {e}")
        return None


async def _analyze_with_gemini_vision(image_path: str) -> Optional[dict]:
    """Run Gemini Vision in a thread pool to avoid blocking the event loop."""
    return await asyncio.to_thread(_call_gemini_vision_sync, image_path)


# ---------- Response Builder ----------

def _llm_data_to_response(llm_data: dict, image_filename: str) -> dict:
    """Convert Gemini structured output into the standard API response format."""
    # Extract units_consumed
    usage = []
    uc = llm_data.get("units_consumed") or {}
    raw_val = uc.get("value")
    if raw_val is not None:
        try:
            match = re.search(r'[\d,]+\.?\d*', str(raw_val))
            if match:
                val = float(match.group().replace(',', ''))
                if val > 0:
                    usage.append({"value": val, "unit": uc.get("unit") or "kWh", "raw": match.group()})
        except (ValueError, TypeError):
            pass

    # Extract amounts — prefer due_amount, then discount_amount, then after_due_amount
    amounts = []
    amt_obj = llm_data.get("amount") or {}
    for key in ("due_amount", "discount_amount", "after_due_amount"):
        raw_amt = amt_obj.get(key)
        if raw_amt is not None:
            try:
                match = re.search(r'[\d,]+\.?\d*', str(raw_amt))
                if match:
                    v = float(match.group().replace(',', ''))
                    if v > 0:
                        amounts.append({"value": v, "raw": match.group()})
                        break  # first valid amount is used for suggested_activity
            except (ValueError, TypeError):
                continue

    suggested_activity = _build_suggestion("electricity", amounts, usage)

    extracted_date = llm_data.get("bill_date")
    if extracted_date:
        parsed_date = _extract_date(extracted_date)
        if not parsed_date:
            extracted_date = None

    result = {
        "image_filename": image_filename,
        "raw_text": (
            f"[Gemini Vision] Provider: {llm_data.get('provider')} | "
            f"Consumer: {llm_data.get('consumer_name')} | "
            f"Units: {(llm_data.get('units_consumed') or {}).get('value')} kWh | "
            f"Due: {(llm_data.get('amount') or {}).get('due_amount')} | "
            f"Bill Date: {llm_data.get('bill_date')} | "
            f"Due Date: {llm_data.get('due_date')}"
        ),
        "bill_type": "electricity",
        "amounts": amounts,
        "units_consumed": usage,
        "extracted_date": extracted_date,
        "suggested_activity": suggested_activity,
    }

    print(f"[OCR] Stage 4 API RESPONSE TO FRONTEND: "
          f"bill_type={result['bill_type']}, "
          f"units_consumed={result['units_consumed']}, "
          f"extracted_date={result['extracted_date']}, "
          f"suggested_activity={result['suggested_activity']}")

    return result


# ---------- Main OCR Pipeline ----------

def save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded file and return the relative path."""
    ext = Path(filename).suffix or ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / unique_name
    filepath.write_bytes(file_bytes)
    return unique_name


def _run_easyocr(image_path: str) -> str:
    """Run EasyOCR (fallback only) — blocking, runs in thread."""
    reader = _get_reader()
    full_path = str(UPLOAD_DIR / image_path)
    results = reader.readtext(full_path, detail=0)
    return "\n".join(results)


async def analyze_bill(image_filename: str) -> dict:
    """
    Full pipeline:
    1. Try Gemini Vision (fast, highly accurate) — PRIMARY path
    2. Fall back to EasyOCR + heuristics ONLY if Gemini fails
    """
    print(f"[OCR] ====== Starting analysis of {image_filename} ======")

    # --- PRIMARY: Gemini Vision ---
    llm_data = await _analyze_with_gemini_vision(image_filename)

    if llm_data is not None and llm_data.get("confidence", 0) > 0.3:
        print(f"[OCR] Stage 9: Using Gemini Vision result (confidence={llm_data.get('confidence')})")
        return _llm_data_to_response(llm_data, image_filename)

    # --- FALLBACK: EasyOCR (only if Gemini failed) ---
    print(f"[OCR] Stage 9: FALLBACK — Gemini returned None or low confidence. Running EasyOCR...")
    raw_text = await asyncio.to_thread(_run_easyocr, image_filename)

    bill_type = _detect_bill_type(raw_text)
    amounts = _extract_amounts(raw_text)
    usage = _extract_usage_values(raw_text, bill_type)
    date = _extract_date(raw_text)
    suggested_activity = _build_suggestion(bill_type, amounts, usage)

    print(f"[OCR] EasyOCR fallback result: bill_type={bill_type}, usage={usage}, date={date}")

    return {
        "image_filename": image_filename,
        "raw_text": raw_text,
        "bill_type": bill_type,
        "amounts": amounts,
        "units_consumed": usage,
        "extracted_date": date,
        "suggested_activity": suggested_activity,
    }


# ---------- EasyOCR Fallback Heuristics ----------

BILL_KEYWORDS = {
    "electricity": [
        "kwh", "kilowatt", "electricity", "electric", "power",
        "energy charge", "utility", "meter reading", "consumption",
        "mahavitaran", "mseb", "bescom", "tata power", "adani",
        "torrent", "lightbill", "energy bill", "units consumed",
        "supply", "महावितरण", "वीज", "देयक", "विद्युत"
    ],
    "water": ["water", "gallon", "sewer", "cubic feet", "ccf", "water usage", "municipal water"],
    "fuel": ["fuel", "gasoline", "diesel", "gas station", "petrol", "gallons", "unleaded", "octane", "pump"],
    "shopping": ["receipt", "total", "subtotal", "tax", "store", "item", "qty", "quantity", "price"],
}


def _detect_bill_type(text: str) -> str:
    text_lower = text.lower()
    scores = {bt: sum(1 for kw in kws if kw in text_lower) for bt, kws in BILL_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "unknown"


def _extract_amounts(text: str) -> list[dict]:
    # Enhanced patterns to support Marathi / Hindi and regional formats
    patterns = [
        r'\$\s*([\d,]+\.?\d*)',
        r'(?:Rs\.?|₹|INR|रु\.?)\s*([\d,]+\.?\d*)',
        r'(?:total|amount|due|charge|देय रक्कम|रक्कम|एकूण)[:\s]*(?:Rs\.?|₹|\$|रु)?\s*([\d,]+\.?\d*)',
        r'([\d,]+\.?\d*)\s*(?:USD|dollars?|INR|rupees?|रु)',
    ]
    amounts = []
    seen = set()
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            try:
                val = float(match.group(1).replace(',', ''))
                if val > 0 and val not in seen:
                    seen.add(val)
                    amounts.append({"value": val, "raw": match.group(0).strip()})
            except ValueError:
                continue
    # Sort amounts by value descending (often the highest amount is the total due)
    amounts.sort(key=lambda x: x["value"], reverse=True)
    return amounts


def _extract_usage_values(text: str, bill_type: str) -> list[dict]:
    unit_patterns = {
        "electricity": [
            (r'([\d,]+\.?\d*)\s*(?:kwh|kWh|KWH)', "kWh"),
            (r'(?:units?\s+consumed|consumption|energy\s+used|एकूण वापर|वापर|युनिट)[:\s=]*\s*([\d,]+\.?\d*)', "kWh"),
            (r'(?:units?|Units?)\s*[:=-]?\s*([\d,]+\.?\d*)', "kWh"),
        ],
        "water": [
            (r'([\d,]+\.?\d*)\s*(?:gal(?:lon)?s?|GAL)', "gallons"),
            (r'([\d,]+\.?\d*)\s*(?:ccf|CCF|cf|CF)', "ccf"),
        ],
        "fuel": [
            (r'([\d,]+\.?\d*)\s*(?:gal(?:lon)?s?|GAL)', "gallons"),
            (r'([\d,]+\.?\d*)\s*(?:liters?|ltrs?|L)', "liters"),
        ],
    }
    results = []
    for pattern, unit in unit_patterns.get(bill_type, []):
        for match in re.finditer(pattern, text, re.IGNORECASE):
            try:
                val = float(match.group(1).replace(',', ''))
                if val > 0:
                    results.append({"value": val, "unit": unit, "raw": match.group(0).strip()})
            except ValueError:
                continue
    return results


def _extract_date(text: str) -> Optional[str]:
    """Extract a realistic date from text."""
    date_patterns = [
        r'\b(\d{2}[-/]\d{2}[-/]\d{4})\b',   # DD-MM-YYYY
        r'\b(\d{4}[-/]\d{2}[-/]\d{2})\b',   # YYYY-MM-DD
        r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2})\b',  # D/M/YY
    ]
    
    for pattern in date_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            candidate = match.group(1)
            parts = re.split(r'[-/]', candidate)
            try:
                if len(parts) == 3:
                    a, b, c = int(parts[0]), int(parts[1]), int(parts[2])
                    if c > 100:  # year is last
                        if 1 <= b <= 12 and 1 <= a <= 31:
                            return candidate
                    else:  # year is first
                        if 1 <= b <= 12 and 1 <= c <= 31:
                            return candidate
            except ValueError:
                continue
    return None


def _build_suggestion(bill_type: str, amounts: list[dict], usage: list[dict]) -> dict:
    category_map = {
        "electricity": ("electricity", "grid_usage", "kWh"),
        "water": ("water", "usage", "gallons"),
        "fuel": ("transportation", "car_trip", "miles"),
        "shopping": ("waste", "landfill", "lbs"),
    }
    category, act_type, default_unit = category_map.get(bill_type, ("waste", "landfill", "lbs"))

    value = None
    unit = default_unit
    if usage:
        value = usage[0]["value"]
        unit = usage[0]["unit"]
    elif amounts:
        value = amounts[0]["value"]

    return {"category": category, "type": act_type, "value": value, "unit": unit}

