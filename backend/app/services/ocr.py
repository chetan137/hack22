"""
ECOSENSE AI — OCR Service

Uses Gemini 2.5 Flash Vision exclusively for data extraction.
No locale assumptions: currency, date format, and bill type are
all derived per-document from what Gemini reads off the bill.
"""

import re
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

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Maps ISO currency codes to their symbols
CURRENCY_SYMBOLS: dict[str, str] = {
    "USD": "$",
    "INR": "₹",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CAD": "CA$",
    "AUD": "A$",
    "CNY": "¥",
}


def _currency_symbol(code: str) -> str:
    """Return the display symbol for a given ISO currency code."""
    return CURRENCY_SYMBOLS.get((code or "").upper().strip(), code or "$")


# ---------- Gemini Vision ----------

def _call_gemini_vision_sync(image_path: str) -> dict:
    """
    Synchronous Gemini Vision call — run inside asyncio.to_thread() to avoid
    blocking the event loop.
    """
    gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY is not set in environment variables.")

    import google.genai as genai
    import PIL.Image

    print(f"[OCR] Stage 1: Calling Gemini Vision on {image_path}")
    t0 = time.time()

    client = genai.Client(api_key=gemini_key)
    full_path = str(UPLOAD_DIR / image_path)
    img = PIL.Image.open(full_path)

    prompt = (
        "You are an expert document parser specializing in utility bills from any country. "
        "Analyze this bill image carefully and extract the following structured information.\n\n"
        "STRICT RULES:\n"
        "1. Extract ONLY values explicitly visible in the image. Support any language.\n"
        "2. Do NOT guess, infer, estimate, or calculate any value.\n"
        "3. For bill_type: classify based on actual document evidence — department name printed "
        "   on the bill, unit type (kWh = electricity, Gallons/CCF = water, therms = gas), "
        "   or service description. Do NOT default to electricity. "
        "   Valid values: \"electricity\", \"water\", \"gas\", \"fuel\", \"shopping\", \"unknown\".\n"
        "4. For bill_date and due_date: extract the date EXACTLY as printed (e.g. '11/27/2024', "
        "   '27-11-2024', '2024-11-27'). Do NOT reformat. If not visible, return null.\n"
        "5. For currency: detect from the currency symbol printed next to amounts. "
        "   $ = USD, ₹ = INR, € = EUR, £ = GBP. Return the 3-letter ISO code (e.g. 'USD', 'INR').\n"
        "6. For units_consumed: use fields indicating usage like 'Units Consumed', 'Consumption', "
        "   'Gallons', 'Usage', 'वापर'. Do NOT use meter readings (Previous/Present Reading).\n"
        "7. For amounts: extract the primary total balance due. If multiple amounts exist, "
        "   prefer 'Total Balance Due', 'Amount Due', 'Total Due', 'देय रक्कम'.\n"
        "8. If a field is not visible or not applicable, return null — never guess.\n"
        "9. Return ONLY valid JSON with no markdown, no code fences, no explanation.\n\n"
        "Return exactly this JSON (fill every field from the document, never copy example values):\n"
        "{\n"
        '  "bill_type": null,\n'
        '  "provider": null,\n'
        '  "bill_month": null,\n'
        '  "bill_date": null,\n'
        '  "due_date": null,\n'
        '  "consumer_name": null,\n'
        '  "service_number": null,\n'
        '  "meter_number": null,\n'
        '  "currency": null,\n'
        '  "units_consumed": {"value": null, "unit": null},\n'
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

    raw = response.text.strip()
    print(f"[OCR] Stage 2 RAW GEMINI RESPONSE:\n{raw[:600]}")

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

    # Parse JSON
    try:
        parsed = json.loads(raw)
        print(
            f"[OCR] Stage 3 PARSED: bill_type={parsed.get('bill_type')}, "
            f"currency={parsed.get('currency')}, "
            f"units_consumed={parsed.get('units_consumed')}, "
            f"amount={parsed.get('amount')}, "
            f"bill_date={parsed.get('bill_date')}, "
            f"due_date={parsed.get('due_date')}, "
            f"confidence={parsed.get('confidence')}"
        )
        return parsed

    except json.JSONDecodeError as e:
        print(f"[OCR] Stage 3 JSON parse failed: {e}\nRaw output: {raw}")
        raise ValueError("Gemini returned invalid JSON.")


async def _analyze_with_gemini_vision(image_path: str) -> dict:
    """Run Gemini Vision in a thread pool to avoid blocking the event loop."""
    return await asyncio.to_thread(_call_gemini_vision_sync, image_path)


# ---------- Date handling ----------

def _sanitize_date(date_val: Optional[str]) -> Optional[str]:
    """
    Accept a date string as returned by Gemini (already extracted from the document).
    Validates that it looks like a real date and returns it as-is.
    We do NOT reformat or re-parse — Gemini already read the format off the bill.
    Returns None only if the value is empty, null-like, or clearly not a date.
    """
    if not date_val:
        return None

    s = str(date_val).strip()
    if not s or s.lower() in ("null", "none", "n/a", "", "not found"):
        return None

    # Accept if it contains digits and a separator (/, -, space) — minimal sanity check
    if re.search(r'\d{1,4}[\/\-\s]\d{1,2}[\/\-\s]\d{2,4}', s):
        return s

    # Accept plain year-only or month-year strings as a fallback
    if re.search(r'\d{4}', s):
        return s

    return None


# ---------- Suggestion builder ----------

def _build_suggestion(bill_type: str, amounts: list[dict], usage: list[dict]) -> dict:
    category_map = {
        "electricity": ("electricity", "grid_usage", "kWh"),
        "water": ("water", "water_usage", "gallons"),
        "gas": ("energy", "gas_usage", "therms"),
        "fuel": ("transportation", "car_trip", "miles"),
        "shopping": ("waste", "landfill", "lbs"),
    }
    bill_type_normalized = (bill_type or "unknown").lower()
    category, act_type, default_unit = category_map.get(
        bill_type_normalized, ("electricity", "grid_usage", "kWh")
    )

    value = None
    unit = default_unit
    if usage:
        value = usage[0]["value"]
        unit = usage[0]["unit"]
    elif amounts:
        value = amounts[0]["value"]

    return {"category": category, "type": act_type, "value": value, "unit": unit}


# ---------- Response builder ----------

def _llm_data_to_response(llm_data: dict, image_filename: str) -> dict:
    """Convert Gemini structured output into the standard API response format."""

    # ── units_consumed ──────────────────────────────────────
    usage = []
    uc = llm_data.get("units_consumed") or {}
    raw_val = uc.get("value")
    if raw_val is not None:
        try:
            match = re.search(r'[\d,]+\.?\d*', str(raw_val))
            if match:
                val = float(match.group().replace(',', ''))
                if val > 0:
                    usage.append({
                        "value": val,
                        "unit": uc.get("unit") or "units",
                        "raw": match.group()
                    })
        except (ValueError, TypeError):
            pass

    # ── amounts ─────────────────────────────────────────────
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
                        break
            except (ValueError, TypeError):
                continue

    # ── bill_type — use what Gemini returned, never default to electricity ──
    bill_type = (llm_data.get("bill_type") or "unknown").lower().strip()

    # ── currency — from Gemini's detected currency field ────
    currency_code = (llm_data.get("currency") or "").upper().strip() or None
    currency_symbol = _currency_symbol(currency_code) if currency_code else "$"

    # ── date — trust Gemini's extraction, just sanitize ─────
    # Gemini may return under "bill_date" or "statement_date"
    raw_date = llm_data.get("bill_date") or llm_data.get("statement_date")
    extracted_date = _sanitize_date(raw_date)

    suggested_activity = _build_suggestion(bill_type, amounts, usage)

    result = {
        "image_filename": image_filename,
        "raw_text": (
            f"[Gemini Vision] Provider: {llm_data.get('provider')} | "
            f"Consumer: {llm_data.get('consumer_name')} | "
            f"Units: {(llm_data.get('units_consumed') or {}).get('value')} "
            f"{(llm_data.get('units_consumed') or {}).get('unit')} | "
            f"Due: {currency_symbol}{(llm_data.get('amount') or {}).get('due_amount')} | "
            f"Bill Date: {llm_data.get('bill_date')} | "
            f"Due Date: {llm_data.get('due_date')}"
        ),
        "bill_type": bill_type,
        "currency": currency_code,
        "currency_symbol": currency_symbol,
        "amounts": amounts,
        "units_consumed": usage,
        "extracted_date": extracted_date,
        "suggested_activity": suggested_activity,
    }

    print(
        f"[OCR] API RESPONSE: bill_type={result['bill_type']}, "
        f"currency={result['currency']} ({result['currency_symbol']}), "
        f"units_consumed={result['units_consumed']}, "
        f"extracted_date={result['extracted_date']}, "
        f"suggested_activity={result['suggested_activity']}"
    )

    return result


# ---------- File utilities ----------

def save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded file and return the relative path."""
    ext = Path(filename).suffix or ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / unique_name
    filepath.write_bytes(file_bytes)
    return unique_name


async def analyze_bill(image_filename: str) -> dict:
    """Analyzes the bill using Gemini Vision API."""
    print(f"[OCR] ====== Starting analysis of {image_filename} ======")
    try:
        llm_data = await _analyze_with_gemini_vision(image_filename)
        return _llm_data_to_response(llm_data, image_filename)
    except Exception as e:
        print(f"[OCR] Analysis failed: {str(e)}")
        raise e
