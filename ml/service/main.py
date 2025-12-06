"""
FastAPI Microservice for Bank Lead Scoring

Microservice ini menyediakan REST API untuk inference model lead scoring.

Endpoints:
- GET /health: Health check
- POST /score: Lead scoring inference

Run server:
    uvicorn main:app --reload --port 8000
    
Test endpoints:
    curl http://localhost:8000/health
    curl -X POST http://localhost:8000/score -H "Content-Type: application/json" -d @sample_request.json
"""

import logging
from contextlib import asynccontextmanager
from typing import List, Literal

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

from inference_service import (
    load_artifacts,
    run_inference,
    InferenceError,
    Artifacts,
)


# =============================================================================
# LOGGING SETUP
# =============================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# =============================================================================
# LIFESPAN EVENT HANDLER
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler untuk startup dan shutdown."""
    # Startup
    global artifacts
    logger.info("=" * 60)
    logger.info("Starting Bank Lead Scoring Service")
    logger.info("=" * 60)
    
    try:
        logger.info("Loading model artifacts...")
        artifacts = load_artifacts("./artifacts")
        logger.info(f"✓ Artifacts loaded successfully")
        logger.info(f"✓ Model features: {len(artifacts.feature_names)}")
        logger.info(f"✓ Feature names: {artifacts.feature_names}")
        logger.info("=" * 60)
        logger.info("Service ready to accept requests")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"✗ Failed to load artifacts: {e}")
        logger.error("Service cannot start without model artifacts")
        raise RuntimeError("Cannot start service without model artifacts")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Bank Lead Scoring Service")


# =============================================================================
# FASTAPI APP INITIALIZATION
# =============================================================================
app = FastAPI(
    title="Bank Lead Scoring API",
    description="Microservice untuk inference model lead scoring bank",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware (optional, uncomment jika diperlukan)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Next.js frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# =============================================================================
# GLOBAL STATE - MODEL ARTIFACTS
# =============================================================================
artifacts: Artifacts = None


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class LeadFeatures(BaseModel):
    """Request model untuk customer features."""
    age: int = Field(..., ge=18, le=100, description="Usia nasabah")
    job: Literal[
        "admin.", "blue-collar", "entrepreneur", "housemaid", "management",
        "retired", "self-employed", "services", "student", "technician",
        "unemployed", "unknown"
    ] = Field(..., description="Jenis pekerjaan")
    marital: Literal["divorced", "married", "single"] = Field(..., description="Status pernikahan")
    education: Literal["primary", "secondary", "tertiary", "unknown"] = Field(..., description="Tingkat pendidikan")
    default: Literal["no", "yes"] = Field(..., description="Apakah pernah default kredit")
    balance: int = Field(..., description="Saldo tahunan rata-rata (dalam EUR)")
    housing: Literal["no", "yes"] = Field(..., description="Apakah memiliki kredit rumah")
    loan: Literal["no", "yes"] = Field(..., description="Apakah memiliki pinjaman personal")
    contact: Literal["cellular", "telephone", "unknown"] = Field(..., description="Tipe komunikasi kontak")
    day: int = Field(..., ge=1, le=31, description="Hari terakhir kontak dalam bulan")
    month: Literal["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] = Field(
        ..., description="Bulan terakhir kontak"
    )
    campaign: int = Field(..., ge=1, description="Jumlah kontak selama kampanye ini")
    pdays: int = Field(..., ge=-1, description="Hari sejak kontak terakhir (-1 = belum pernah)")
    previous: int = Field(..., ge=0, description="Jumlah kontak sebelum kampanye ini")
    poutcome: Literal["failure", "other", "success", "unknown"] = Field(
        ..., description="Hasil kampanye marketing sebelumnya"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "age": 35,
                "job": "technician",
                "marital": "married",
                "education": "tertiary",
                "default": "no",
                "balance": 1500,
                "housing": "yes",
                "loan": "no",
                "contact": "cellular",
                "day": 15,
                "month": "may",
                "campaign": 2,
                "pdays": -1,
                "previous": 0,
                "poutcome": "unknown"
            }
        }
    )


class ReasonCode(BaseModel):
    """Model untuk single reason code."""
    feature: str = Field(..., description="Nama fitur yang berpengaruh")
    direction: Literal["positive", "negative"] = Field(..., description="Arah kontribusi")
    shap_value: float = Field(..., description="Nilai SHAP (importance)")


class InferenceResult(BaseModel):
    """Response model untuk hasil inference."""
    probability: float = Field(..., ge=0.0, le=1.0, description="Probabilitas subscribe (0.0 - 1.0)")
    prediction: Literal[0, 1] = Field(..., description="Prediksi binary (0 = tidak, 1 = ya)")
    prediction_label: Literal["yes", "no"] = Field(..., description="Label prediksi")
    risk_level: Literal["Low", "Medium", "High"] = Field(..., description="Level konversi")
    reason_codes: List[ReasonCode] = Field(
        ..., min_length=5, max_length=5, description="Top 5 fitur paling berpengaruh"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "probability": 0.128,
                "prediction": 0,
                "prediction_label": "no",
                "risk_level": "Low",
                "reason_codes": [
                    {"feature": "contact", "direction": "positive", "shap_value": 0.277},
                    {"feature": "housing", "direction": "negative", "shap_value": -0.229},
                    {"feature": "day", "direction": "positive", "shap_value": 0.177},
                    {"feature": "balance", "direction": "positive", "shap_value": 0.168},
                    {"feature": "month", "direction": "negative", "shap_value": -0.159}
                ]
            }
        }
    )


class HealthResponse(BaseModel):
    """Response model untuk health check."""
    status: str = Field(..., description="Status service")
    model_loaded: bool = Field(..., description="Apakah model sudah di-load")
    feature_count: int = Field(..., description="Jumlah fitur model")


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError (input validation errors)."""
    logger.warning(f"Invalid input: {exc}")
    return JSONResponse(
        status_code=400,
        content={
            "error": "Invalid input",
            "detail": str(exc)
        }
    )


@app.exception_handler(InferenceError)
async def inference_error_handler(request: Request, exc: InferenceError):
    """Handle InferenceError (model inference errors)."""
    logger.error(f"Inference error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Inference failed",
            "detail": "An error occurred during model inference"
        }
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred"
        }
    )


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Bank Lead Scoring API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "score": "/score",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns service status dan informasi model.
    """
    return HealthResponse(
        status="ok",
        model_loaded=artifacts is not None,
        feature_count=len(artifacts.feature_names) if artifacts else 0
    )


@app.post("/score", response_model=InferenceResult, tags=["Inference"])
async def score_lead(features: LeadFeatures):
    """
    Lead scoring inference endpoint.
    
    Menerima customer features dan mengembalikan:
    - Probability: Probabilitas customer akan subscribe
    - Prediction: Binary prediction (0 atau 1)
    - Risk level: Low/Medium/High
    - Reason codes: Top 5 fitur yang paling berpengaruh
    
    Parameters
    ----------
    features : LeadFeatures
        Customer features untuk di-score
    
    Returns
    -------
    InferenceResult
        Hasil inference dengan probability, prediction, dan reason codes
    
    Raises
    ------
    400
        Jika input tidak valid
    500
        Jika terjadi error saat inference
    """
    # Check if model loaded
    if artifacts is None:
        raise InferenceError("Model artifacts not loaded")
    
    # Convert Pydantic model to dict
    input_dict = features.model_dump()
    
    logger.info(f"Processing inference request for customer: age={features.age}, job={features.job}")
    
    # Run inference
    result = run_inference(input_dict, artifacts)
    
    logger.info(f"Inference complete: probability={result['probability']:.4f}, prediction={result['prediction_label']}")
    
    return InferenceResult(**result)


# =============================================================================
# MAIN (for local development)
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Run server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
