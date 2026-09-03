"""Singleton model inference service for CatBoost champion model."""

import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

from app.schemas.prediction import (
    BulkPredictionResponse,
    BulkPredictionRowResult,
    BulkRiskDistribution,
    PredictionResponse,
    SingleBookingInput,
)

logger = logging.getLogger("model_service")

CHAMPION_DIR = Path(__file__).resolve().parent.parent / "ml" / "models" / "champion"
MODEL_PATH = CHAMPION_DIR / "catboost_model.cbm"
METADATA_PATH = CHAMPION_DIR / "model_metadata.json"

MONTH_MAP = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}


class ModelInferenceService:
    """Service for loading and executing predictions with the Champion CatBoost model."""

    _instance = None

    def __new__(cls) -> "ModelInferenceService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return

        self._model: CatBoostClassifier | None = None
        self._metadata: dict[str, Any] = {}
        self._optimal_threshold: float = 0.54
        self._low_threshold: float = 0.35
        self._all_features: list[str] = []
        self._categorical_features: list[str] = []
        self._numerical_features: list[str] = []

        self.load_artifacts()
        self._initialized = True

    def load_artifacts(self) -> None:
        """Load model binary and metadata JSON from disk."""
        logger.info("Loading Champion CatBoost model from %s...", MODEL_PATH)
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Champion model binary not found at {MODEL_PATH}")
        if not METADATA_PATH.exists():
            raise FileNotFoundError(f"Model metadata not found at {METADATA_PATH}")

        with open(METADATA_PATH, encoding="utf-8") as f:
            self._metadata = json.load(f)

        self._model = CatBoostClassifier()
        self._model.load_model(str(MODEL_PATH))

        self._optimal_threshold = float(self._metadata.get("optimal_threshold", 0.54))
        self._low_threshold = float(
            self._metadata.get("risk_thresholds", {}).get("low_upper", 0.35)
        )
        self._all_features = self._metadata["features"]["all_features"]
        self._categorical_features = self._metadata["features"]["categorical"]
        self._numerical_features = self._metadata["features"]["numerical"]
        logger.info("Model loaded successfully. Optimal threshold: %.2f", self._optimal_threshold)

    @property
    def is_loaded(self) -> bool:
        """Return True if model is loaded and ready for inference."""
        return self._model is not None and self._model.is_fitted()

    @property
    def metadata(self) -> dict[str, Any]:
        """Return model metadata dictionary."""
        return self._metadata

    def get_risk_label(self, probability: float) -> str:
        """Map cancellation probability to business risk tier."""
        if probability < self._low_threshold:
            return "Rendah"
        if probability < self._optimal_threshold:
            return "Sedang"
        return "Tinggi"

    def preprocess_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering and ensure schema alignment."""
        data = df.copy()

        # Total stays & Total guests
        if "total_stay_nights" not in data.columns:
            data["total_stay_nights"] = (
                data["stays_in_weekend_nights"] + data["stays_in_week_nights"]
            ).astype(int)

        if "total_guests" not in data.columns:
            data["total_guests"] = (
                data["adults"] + data.get("children", 0).fillna(0) + data.get("babies", 0).fillna(0)
            ).astype(int)

        # Date normalization
        if "arrival_year" not in data.columns and "arrival_date_year" in data.columns:
            data["arrival_year"] = data["arrival_date_year"].astype(int)

        if "arrival_month_num" not in data.columns and "arrival_date_month" in data.columns:
            data["arrival_month_num"] = (
                data["arrival_date_month"].map(MONTH_MAP).fillna(1).astype(int)
            )

        if (
            "arrival_week_number" not in data.columns
            and "arrival_date_week_number" in data.columns
        ):
            data["arrival_week_number"] = data["arrival_date_week_number"].astype(int)

        if "arrival_day" not in data.columns and "arrival_date_day_of_month" in data.columns:
            data["arrival_day"] = data["arrival_date_day_of_month"].astype(int)

        # Weekend arrival
        if "is_weekend_arrival" not in data.columns:
            date_series = (
                data["arrival_year"].astype(str)
                + "-"
                + data["arrival_month_num"].astype(str).str.zfill(2)
                + "-"
                + data["arrival_day"].astype(str).str.zfill(2)
            )
            dates = pd.to_datetime(date_series, errors="coerce")
            data["is_weekend_arrival"] = (dates.dt.dayofweek >= 5).astype(int)

        # Historical cancellations
        if "previous_booking_activity" not in data.columns:
            data["previous_booking_activity"] = (
                data["previous_cancellations"] + data["previous_bookings_not_canceled"]
            ).astype(int)

        if "previous_cancellation_rate" not in data.columns:
            data["previous_cancellation_rate"] = np.where(
                data["previous_booking_activity"] > 0,
                data["previous_cancellations"] / data["previous_booking_activity"],
                0.0,
            ).astype(float)

        # Ensure all required features exist
        for col in self._categorical_features:
            if col not in data.columns:
                data[col] = "Unknown"
            data[col] = data[col].fillna("Unknown").astype(str)

        for col in self._numerical_features:
            if col not in data.columns:
                data[col] = 0
            data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0)

        # Reorder to match model feature expectation
        return data[self._all_features]

    def predict_single(self, payload: SingleBookingInput) -> PredictionResponse:
        """Perform real-time cancellation prediction on single reservation payload."""
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")

        df_input = pd.DataFrame([payload.model_dump()])
        processed_df = self.preprocess_dataframe(df_input)

        proba = float(self._model.predict_proba(processed_df)[0, 1])
        proba_rounded = round(proba, 4)
        risk_label = self.get_risk_label(proba)
        is_canceled = 1 if proba >= self._optimal_threshold else 0

        req_id = f"req-{uuid.uuid4().hex[:12]}"

        return PredictionResponse(
            request_id=req_id,
            probability=proba_rounded,
            risk_label=risk_label,
            threshold_used=self._optimal_threshold,
            model_name=self._metadata.get("model_name", "CatBoostClassifier"),
            model_version=self._metadata.get("model_version", "1.0.0"),
            is_canceled_prediction=is_canceled,
        )

    def predict_bulk_dataframe(self, df: pd.DataFrame) -> BulkPredictionResponse:
        """Execute high-throughput batch prediction on a validated DataFrame."""
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")

        start_time = time.perf_counter()
        processed_df = self.preprocess_dataframe(df)

        probas = self._model.predict_proba(processed_df)[:, 1]
        exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        results: list[BulkPredictionRowResult] = []
        low_count = 0
        medium_count = 0
        high_count = 0
        canceled_count = 0

        for idx, p in enumerate(probas):
            p_val = round(float(p), 4)
            label = self.get_risk_label(p_val)
            is_cancel = 1 if p_val >= self._optimal_threshold else 0

            if label == "Rendah":
                low_count += 1
            elif label == "Sedang":
                medium_count += 1
            else:
                high_count += 1

            if is_cancel == 1:
                canceled_count += 1

            # Key summary from original df
            orig_row = df.iloc[idx]
            key_summary = {
                "hotel": str(orig_row.get("hotel", "Unknown")),
                "lead_time": int(orig_row.get("lead_time", 0)),
                "adr": float(orig_row.get("adr", 0.0)),
                "customer_type": str(orig_row.get("customer_type", "Transient")),
            }

            results.append(
                BulkPredictionRowResult(
                    row_id=idx + 1,
                    probability=p_val,
                    risk_label=label,
                    is_canceled_prediction=is_cancel,
                    key_summary=key_summary,
                )
            )

        total_rows = len(df)
        cancel_rate = round(canceled_count / total_rows, 4) if total_rows > 0 else 0.0

        return BulkPredictionResponse(
            total_rows_processed=total_rows,
            execution_time_ms=exec_time_ms,
            risk_distribution=BulkRiskDistribution(
                low_count=low_count,
                medium_count=medium_count,
                high_count=high_count,
                cancellation_rate_predicted=cancel_rate,
            ),
            results=results,
        )


model_service = ModelInferenceService()
