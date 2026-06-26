"""
ECOSENSE AI — Prediction API
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.api.deps import get_current_active_user
from app.models.user import User

try:
    from app.services.prediction import train_user_models, predict_future
    PREDICTION_AVAILABLE = True
except ImportError:
    PREDICTION_AVAILABLE = False

router = APIRouter()

@router.post("/train")
async def train_models(current_user: User = Depends(get_current_active_user)):
    """Trigger background training of ML models based on user's historical data."""
    if not PREDICTION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Prediction service unavailable (missing numpy/scikit-learn).")
    try:
        result = await train_user_models(current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/forecast")
async def get_forecast(days: int = 30, current_user: User = Depends(get_current_active_user)):
    """Get future predictions and confidence scores."""
    if not PREDICTION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Prediction service unavailable (missing numpy/scikit-learn).")
    try:
        result = await predict_future(current_user.id, horizon_days=days)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
