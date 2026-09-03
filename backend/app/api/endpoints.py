"""FastAPI API routes for predictions, benchmark reports, and health check."""

import io
import json
import logging
import uuid
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.prediction import (
    BulkPredictionResponse,
    PredictionResponse,
    SingleBookingInput,
)
from app.services.logging_service import LOG_FILE_PATH, prediction_logger
from app.services.model_service import model_service

logger = logging.getLogger("api_endpoints")
router = APIRouter()

# Robust absolute path resolution independent of current working directory
ROOT_DIR = Path(__file__).resolve().parents[3]
BENCHMARK_REPORT_PATH = ROOT_DIR / "reports" / "benchmark" / "benchmark_results.json"
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_ROW_COUNT = 10000


@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for verifying API status and model readiness."""
    return {
        "status": "healthy",
        "service": "hotel-booking-cancellation-api",
        "model_loaded": model_service.is_loaded,
        "optimal_threshold": model_service.metadata.get("optimal_threshold", 0.54),
        "log_file_exists": LOG_FILE_PATH.exists(),
        "environment": "production" if model_service.is_loaded else "development",
    }


@router.get("/models/benchmark", tags=["Benchmark"])
async def get_model_benchmark():
    """Retrieve 3-model comparative benchmark results and threshold analysis."""
    if not BENCHMARK_REPORT_PATH.exists():
        logger.warning("Benchmark file not found at %s", BENCHMARK_REPORT_PATH)
        raise HTTPException(
            status_code=404,
            detail="Benchmark report not found. Please run train_benchmark.py first.",
        )

    try:
        with open(BENCHMARK_REPORT_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error("Error reading benchmark results: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load benchmark results.") from e


@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_single_booking(payload: SingleBookingInput):
    """Predict cancellation probability and risk tier for a single hotel reservation."""
    try:
        result = model_service.predict_single(payload)

        # Async thread-safe logging
        await prediction_logger.log_single_prediction(
            request_id=result.request_id,
            probability=result.probability,
            risk_label=result.risk_label,
            model_name=result.model_name,
            model_version=result.model_version,
            row_id=1,
            status="success",
        )

        return result
    except Exception as e:
        logger.error("Single prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Prediction error: {e!s}") from e


@router.post("/predict/bulk", response_model=BulkPredictionResponse, tags=["Prediction"])
async def predict_bulk_bookings(file: UploadFile = File(...)):
    """Predict cancellation risk for a batch of hotel reservations via CSV upload.

    Guardrails enforced:
    - Maximum file size: 5 MB
    - Maximum row count: 10,000 reservation records
    """
    # 1. Enforce file extension & size guardrail
    if file.filename and not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="File harus berformat CSV dengan ekstensi .csv",
        )

    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Ukuran file ({file_size / (1024 * 1024):.2f} MB) melebihi batas maksimal 5 MB."
            ),
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File CSV kosong (0 bytes).")

    # 2. Parse CSV and enforce row count guardrail
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Format CSV tidak valid atau rusak: {e!s}",
        ) from e

    total_rows = len(df)
    if total_rows == 0:
        raise HTTPException(status_code=400, detail="File CSV tidak memiliki baris data.")

    if total_rows > MAX_ROW_COUNT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Jumlah baris data ({total_rows} baris) melebihi batas maksimal "
                f"{MAX_ROW_COUNT} baris per upload (maksimal 10.000 baris)."
            ),
        )

    # 3. Perform batch inference
    try:
        bulk_response = model_service.predict_bulk_dataframe(df)

        # 4. Async batch logging
        batch_id = f"bulk-{uuid.uuid4().hex[:10]}"
        raw_log_items = [
            {
                "row_id": r.row_id,
                "probability": r.probability,
                "risk_label": r.risk_label,
            }
            for r in bulk_response.results
        ]

        await prediction_logger.log_bulk_predictions(
            request_id=batch_id,
            batch_results=raw_log_items,
            model_name=model_service.metadata.get("model_name", "CatBoostClassifier"),
            model_version=model_service.metadata.get("model_version", "1.0.0"),
            status="success",
        )

        return bulk_response
    except Exception as e:
        logger.error("Bulk prediction processing failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Bulk processing error: {e!s}") from e
