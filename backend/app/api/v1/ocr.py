"""
ECOSENSE AI — OCR API Endpoints
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.ocr import save_upload, analyze_bill

router = APIRouter()


class OCRAnalyzeResponse(BaseModel):
    image_filename: str
    raw_text: str
    bill_type: str
    currency: Optional[str] = None
    currency_symbol: str = "$"
    amounts: list[dict]
    units_consumed: list[dict]
    extracted_date: Optional[str]
    suggested_activity: dict


class OCRSaveRequest(BaseModel):
    category: str
    type: str
    value: float
    unit: str
    date: Optional[str] = None


@router.post("/analyze", response_model=OCRAnalyzeResponse)
async def analyze_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a bill image, run OCR, and return extracted data."""
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_types}"
        )

    # Read and save file
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    filename = save_upload(contents, file.filename or "upload.png")

    # Run OCR pipeline
    try:
        result = await analyze_bill(filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    return result


@router.post("/save")
async def save_ocr_activity(
    data: OCRSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Save the user-validated OCR extraction as a new activity."""
    from app.schemas.activity import ActivityCreate
    from app.services.activity import create_activity

    activity_data = ActivityCreate(
        category=data.category,
        type=data.type,
        value=data.value,
        unit=data.unit,
        date=None,
    )
    activity = await create_activity(db, current_user.id, activity_data)
    return {
        "message": "Activity saved successfully from OCR",
        "activity_id": str(activity.id),
        "impact_score": activity.impact_score,
    }
