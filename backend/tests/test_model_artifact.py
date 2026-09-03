"""Unit tests for Champion CatBoost model artifact and benchmark reports."""

import json
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

ROOT_DIR = Path(__file__).resolve().parents[2]
CHAMPION_DIR = ROOT_DIR / "backend" / "app" / "ml" / "models" / "champion"
MODEL_PATH = CHAMPION_DIR / "catboost_model.cbm"
METADATA_PATH = CHAMPION_DIR / "model_metadata.json"
BENCHMARK_PATH = ROOT_DIR / "reports" / "benchmark" / "benchmark_results.json"


def test_champion_artifact_exists_and_size_valid():
    """Ensure that the champion .cbm file exists and is strictly under 20 MB."""
    assert MODEL_PATH.exists(), f"Champion model artifact not found at {MODEL_PATH}"
    size_bytes = MODEL_PATH.stat().st_size
    size_mb = size_bytes / (1024 * 1024)
    msg = f"Artifact size ({size_mb:.2f} MB) is outside valid range (0.1 - 20 MB)"
    assert 0.1 < size_mb < 20.0, msg


def test_metadata_json_integrity():
    """Verify schema, attributes, thresholds, and metrics in model_metadata.json."""
    assert METADATA_PATH.exists(), f"Metadata JSON not found at {METADATA_PATH}"
    with open(METADATA_PATH, encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_name"] == "CatBoostClassifier"
    assert meta["artifact_format"] == "cbm"
    assert "optimal_threshold" in meta
    assert 0.1 <= meta["optimal_threshold"] <= 0.9
    assert "risk_thresholds" in meta
    assert meta["risk_thresholds"]["low_upper"] == 0.35
    assert meta["risk_thresholds"]["medium_upper"] == meta["optimal_threshold"]

    # Verify features list
    assert "features" in meta
    assert len(meta["features"]["numerical"]) == 23
    assert len(meta["features"]["categorical"]) == 9
    assert len(meta["features"]["all_features"]) == 32

    # Verify validation and test metrics
    for split_metric in ["metrics_val", "metrics_test"]:
        assert split_metric in meta
        m = meta[split_metric]
        assert "f1_score" in m and m["f1_score"] > 0.75
        assert "recall" in m and m["recall"] > 0.75
        assert "precision" in m and m["precision"] > 0.75
        assert "roc_auc" in m and m["roc_auc"] > 0.85
        assert "pr_auc" in m and m["pr_auc"] > 0.80


def test_catboost_model_loads_successfully():
    """Verify that CatBoostClassifier can successfully load the .cbm binary artifact."""
    model = CatBoostClassifier()
    model.load_model(str(MODEL_PATH))
    assert model.is_fitted(), "Loaded CatBoost model must be in fitted state"


def test_model_predict_smoke_test():
    """Smoke test: predict on a realistic dummy sample and check output format."""
    with open(METADATA_PATH, encoding="utf-8") as f:
        meta = json.load(f)

    model = CatBoostClassifier()
    model.load_model(str(MODEL_PATH))

    # Construct single sample input
    sample_data = {
        "lead_time": [45],
        "arrival_year": [2017],
        "arrival_month_num": [8],
        "arrival_week_number": [32],
        "arrival_day": [10],
        "stays_in_weekend_nights": [1],
        "stays_in_week_nights": [3],
        "total_stay_nights": [4],
        "adults": [2],
        "children": [0],
        "babies": [0],
        "total_guests": [2],
        "is_repeated_guest": [0],
        "previous_cancellations": [0],
        "previous_bookings_not_canceled": [0],
        "previous_booking_activity": [0],
        "previous_cancellation_rate": [0.0],
        "booking_changes": [0],
        "days_in_waiting_list": [0],
        "adr": [120.50],
        "required_car_parking_spaces": [0],
        "total_of_special_requests": [1],
        "is_weekend_arrival": [0],
        "hotel": ["City Hotel"],
        "meal": ["BB"],
        "country": ["PRT"],
        "market_segment": ["Online TA"],
        "distribution_channel": ["TA/TO"],
        "reserved_room_type": ["A"],
        "assigned_room_type": ["A"],
        "deposit_type": ["No Deposit"],
        "customer_type": ["Transient"],
    }

    df_sample = pd.DataFrame(sample_data)[meta["features"]["all_features"]]
    proba = model.predict_proba(df_sample)[:, 1]

    assert isinstance(proba, np.ndarray)
    assert len(proba) == 1
    assert 0.0 <= proba[0] <= 1.0


def test_benchmark_results_json_valid():
    """Ensure benchmark_results.json exists, contains 3 models, and designates CatBoost."""
    assert BENCHMARK_PATH.exists(), f"Benchmark results not found at {BENCHMARK_PATH}"
    with open(BENCHMARK_PATH, encoding="utf-8") as f:
        bench = json.load(f)

    assert bench["champion"] == "CatBoost"
    model_names = [m["name"] for m in bench["models"]]
    assert "Logistic Regression" in model_names
    assert "Random Forest" in model_names
    assert "CatBoost" in model_names

    # Check that threshold scan results exist
    assert "threshold_scan_results" in bench
    assert len(bench["threshold_scan_results"]) > 20
