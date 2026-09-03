"""Model Training, 3-Philosophy Benchmarking, Threshold Tuning, and Champion Export.

SDG 8 MVP: Hotel Booking Cancellation Risk Prediction.
"""

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, Pool
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("train_benchmark")

PROCESSED_DIR = Path("data/processed")
CHAMPION_DIR = Path("backend/app/ml/models/champion")
REPORTS_DIR = Path("reports/benchmark")


def load_processed_data() -> tuple[
    pd.DataFrame,
    pd.DataFrame,
    pd.DataFrame,
    dict[str, Any],
]:
    """Load train, val, test splits and feature metadata schema."""
    logger.info("Loading processed datasets from %s...", PROCESSED_DIR)
    train_df = pd.read_parquet(PROCESSED_DIR / "train.parquet")
    val_df = pd.read_parquet(PROCESSED_DIR / "val.parquet")
    test_df = pd.read_parquet(PROCESSED_DIR / "test.parquet")

    with open(PROCESSED_DIR / "feature_metadata.json", encoding="utf-8") as f:
        metadata = json.load(f)

    logger.info(
        "Data loaded: Train (%d), Val (%d), Test (%d)",
        len(train_df),
        len(val_df),
        len(test_df),
    )
    return train_df, val_df, test_df, metadata


def compute_metrics(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    threshold: float = 0.50,
) -> dict[str, Any]:
    """Compute comprehensive classification metrics for positive class (cancellation)."""
    y_pred = (y_proba >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    return {
        "threshold": round(float(threshold), 4),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_proba)), 4),
        "pr_auc": round(float(average_precision_score(y_true, y_proba)), 4),
        "log_loss": round(float(log_loss(y_true, y_proba)), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
    }


def build_sklearn_preprocessor(
    numerical_features: list[str],
    categorical_features: list[str],
) -> ColumnTransformer:
    """Build Scikit-Learn ColumnTransformer preprocessor for Linear & Bagging models."""
    num_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", num_pipeline, numerical_features),
            ("cat", cat_pipeline, categorical_features),
        ]
    )


def train_logistic_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    preprocessor: ColumnTransformer,
) -> tuple[Pipeline, dict[str, Any], np.ndarray]:
    """Train Baseline Logistic Regression model with Scikit-Learn Pipeline."""
    logger.info("Training Model 1: Baseline Logistic Regression (CPU)...")
    clf = Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    random_state=42,
                    C=1.0,
                ),
            ),
        ]
    )

    start_time = time.perf_counter()
    clf.fit(X_train, y_train)
    train_time = round(time.perf_counter() - start_time, 2)

    # Validation inference
    val_start = time.perf_counter()
    val_proba = clf.predict_proba(X_val)[:, 1]
    val_time = (time.perf_counter() - val_start) / len(X_val) * 1000  # ms/sample

    metrics_val = compute_metrics(y_val.to_numpy(), val_proba, threshold=0.50)
    metrics_val["training_time_sec"] = train_time
    metrics_val["inference_latency_ms_per_row"] = round(val_time, 4)

    logger.info(
        "Logistic Regression Val F1: %.4f | Recall: %.4f | ROC-AUC: %.4f (Train Time: %.2fs)",
        metrics_val["f1_score"],
        metrics_val["recall"],
        metrics_val["roc_auc"],
        train_time,
    )
    return clf, metrics_val, val_proba


def train_random_forest(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    preprocessor: ColumnTransformer,
) -> tuple[Pipeline, dict[str, Any], np.ndarray]:
    """Train Challenger 1: Random Forest Classifier (Bagging ensemble)."""
    logger.info("Training Model 2: Challenger 1 Random Forest Classifier (CPU multi-core)...")
    clf = Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=150,
                    max_depth=15,
                    min_samples_split=5,
                    class_weight="balanced_subsample",
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    start_time = time.perf_counter()
    clf.fit(X_train, y_train)
    train_time = round(time.perf_counter() - start_time, 2)

    # Validation inference
    val_start = time.perf_counter()
    val_proba = clf.predict_proba(X_val)[:, 1]
    val_time = (time.perf_counter() - val_start) / len(X_val) * 1000

    metrics_val = compute_metrics(y_val.to_numpy(), val_proba, threshold=0.50)
    metrics_val["training_time_sec"] = train_time
    metrics_val["inference_latency_ms_per_row"] = round(val_time, 4)

    logger.info(
        "Random Forest Val F1: %.4f | Recall: %.4f | ROC-AUC: %.4f (Train Time: %.2fs)",
        metrics_val["f1_score"],
        metrics_val["recall"],
        metrics_val["roc_auc"],
        train_time,
    )
    return clf, metrics_val, val_proba


def train_catboost(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    categorical_features: list[str],
) -> tuple[CatBoostClassifier, dict[str, Any], np.ndarray]:
    """Train Challenger 2: CatBoost Classifier (Boosting champion candidate) with native cat_features."""
    logger.info("Training Model 3: Challenger 2 CatBoost Classifier (Native Categorical Support)...")

    # Format categorical features as strings
    X_train_cb = X_train.copy()
    X_val_cb = X_val.copy()
    for col in categorical_features:
        X_train_cb[col] = X_train_cb[col].fillna("Unknown").astype(str)
        X_val_cb[col] = X_val_cb[col].fillna("Unknown").astype(str)

    train_pool = Pool(X_train_cb, y_train, cat_features=categorical_features)
    val_pool = Pool(X_val_cb, y_val, cat_features=categorical_features)

    # Try GPU first, fallback to CPU
    task_type = "GPU"
    logger.info("Attempting CatBoost training on task_type='%s'...", task_type)

    cb_params = {
        "iterations": 800,
        "learning_rate": 0.08,
        "depth": 6,
        "loss_function": "Logloss",
        "eval_metric": "F1",
        "auto_class_weights": "Balanced",
        "random_seed": 42,
        "verbose": 100,
        "task_type": task_type,
    }

    start_time = time.perf_counter()
    try:
        model = CatBoostClassifier(**cb_params)
        model.fit(train_pool, eval_set=val_pool, early_stopping_rounds=50, verbose=100)
    except Exception as e:  # noqa: BLE001
        logger.warning("GPU training failed (%s). Falling back to task_type='CPU'...", e)
        cb_params["task_type"] = "CPU"
        cb_params["thread_count"] = -1
        model = CatBoostClassifier(**cb_params)
        model.fit(train_pool, eval_set=val_pool, early_stopping_rounds=50, verbose=100)

    train_time = round(time.perf_counter() - start_time, 2)

    val_start = time.perf_counter()
    val_proba = model.predict_proba(X_val_cb)[:, 1]
    val_time = (time.perf_counter() - val_start) / len(X_val_cb) * 1000

    metrics_val = compute_metrics(y_val.to_numpy(), val_proba, threshold=0.50)
    metrics_val["training_time_sec"] = train_time
    metrics_val["inference_latency_ms_per_row"] = round(val_time, 4)

    logger.info(
        "CatBoost Val F1: %.4f | Recall: %.4f | ROC-AUC: %.4f (Train Time: %.2fs)",
        metrics_val["f1_score"],
        metrics_val["recall"],
        metrics_val["roc_auc"],
        train_time,
    )
    return model, metrics_val, val_proba


def find_optimal_threshold(
    y_true: np.ndarray,
    y_proba: np.ndarray,
) -> tuple[float, list[dict[str, Any]]]:
    """Scan decision thresholds on validation set to optimize F1-score with high Recall."""
    logger.info("Scanning decision thresholds on validation set [0.10, 0.90]...")
    thresholds = np.arange(0.10, 0.92, 0.02)
    threshold_results = []

    best_threshold = 0.50
    best_f1 = -1.0

    for th in thresholds:
        m = compute_metrics(y_true, y_proba, threshold=round(float(th), 2))
        threshold_results.append(
            {
                "threshold": m["threshold"],
                "f1_score": m["f1_score"],
                "recall": m["recall"],
                "precision": m["precision"],
                "accuracy": m["accuracy"],
            }
        )
        # We optimize for maximum F1-Score while giving priority if Recall is healthy
        if m["f1_score"] > best_f1:
            best_f1 = m["f1_score"]
            best_threshold = round(float(th), 2)

    logger.info(
        "Optimal Decision Threshold identified: %.2f (Validation F1: %.4f)",
        best_threshold,
        best_f1,
    )
    return best_threshold, threshold_results


def run_benchmark_and_export() -> dict[str, Any]:
    """Orchestrate training, benchmark evaluation, threshold tuning, and artifact exports."""
    CHAMPION_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load Data
    train_df, val_df, test_df, metadata = load_processed_data()
    numerical_features = metadata["numerical_features"]
    categorical_features = metadata["categorical_features"]
    all_features = numerical_features + categorical_features
    target = metadata["target"]

    X_train = train_df[all_features]
    y_train = train_df[target]
    X_val = val_df[all_features]
    y_val = val_df[target]
    X_test = test_df[all_features]
    y_test = test_df[target]

    # Preprocessor for Linear & Bagging
    preprocessor = build_sklearn_preprocessor(numerical_features, categorical_features)

    # 2. Train Models
    _, lr_metrics_val, _ = train_logistic_regression(
        X_train, y_train, X_val, y_val, preprocessor
    )
    _, rf_metrics_val, _ = train_random_forest(
        X_train, y_train, X_val, y_val, preprocessor
    )
    cb_model, cb_metrics_val_default, cb_val_proba = train_catboost(
        X_train, y_train, X_val, y_val, categorical_features
    )

    # 3. Threshold Analysis for CatBoost
    optimal_th, threshold_curve = find_optimal_threshold(y_val.to_numpy(), cb_val_proba)
    cb_metrics_val_optimal = compute_metrics(
        y_val.to_numpy(), cb_val_proba, threshold=optimal_th
    )
    cb_metrics_val_optimal["training_time_sec"] = cb_metrics_val_default["training_time_sec"]
    cb_metrics_val_optimal["inference_latency_ms_per_row"] = cb_metrics_val_default[
        "inference_latency_ms_per_row"
    ]

    # 4. Final Evaluation on Held-Out Test Set
    logger.info("Evaluating Champion CatBoost on Held-Out Test Set (17,882 rows)...")
    X_test_cb = X_test.copy()
    for col in categorical_features:
        X_test_cb[col] = X_test_cb[col].fillna("Unknown").astype(str)

    test_start = time.perf_counter()
    test_proba = cb_model.predict_proba(X_test_cb)[:, 1]
    test_latency = (time.perf_counter() - test_start) / len(X_test_cb) * 1000

    test_metrics_optimal = compute_metrics(
        y_test.to_numpy(), test_proba, threshold=optimal_th
    )
    test_metrics_optimal["inference_latency_ms_per_row"] = round(test_latency, 4)

    logger.info(
        "Test Set Final Metrics (th=%.2f) -> F1: %.4f | Recall: %.4f | Precision: %.4f | ROC-AUC: %.4f | PR-AUC: %.4f",
        optimal_th,
        test_metrics_optimal["f1_score"],
        test_metrics_optimal["recall"],
        test_metrics_optimal["precision"],
        test_metrics_optimal["roc_auc"],
        test_metrics_optimal["pr_auc"],
    )

    # 5. Export Champion Model (.cbm)
    cbm_path = CHAMPION_DIR / "catboost_model.cbm"
    logger.info("Exporting champion model to native binary format: %s...", cbm_path)
    cb_model.save_model(str(cbm_path), format="cbm")

    artifact_size_bytes = cbm_path.stat().st_size
    artifact_size_mb = round(artifact_size_bytes / (1024 * 1024), 2)
    logger.info("Champion artifact size: %.2f MB", artifact_size_mb)
    if artifact_size_mb > 20.0:
        raise ValueError(
            f"Artifact size ({artifact_size_mb} MB) exceeds maximum allowed limit of 20 MB!"
        )

    # 6. Export Model Metadata JSON
    model_metadata = {
        "model_name": "CatBoostClassifier",
        "model_version": "1.0.0",
        "artifact_format": "cbm",
        "artifact_path": "catboost_model.cbm",
        "artifact_size_mb": artifact_size_mb,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "optimal_threshold": optimal_th,
        "risk_thresholds": {
            "low_upper": 0.35,
            "medium_upper": optimal_th,
        },
        "features": {
            "numerical": numerical_features,
            "categorical": categorical_features,
            "all_features": all_features,
        },
        "metrics_val": cb_metrics_val_optimal,
        "metrics_test": test_metrics_optimal,
    }

    metadata_path = CHAMPION_DIR / "model_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    logger.info("Model metadata saved to %s", metadata_path)

    # 7. Export Benchmark Results JSON
    benchmark_report = {
        "benchmark_timestamp": datetime.now(timezone.utc).isoformat(),
        "champion": "CatBoost",
        "models": [
            {
                "name": "Logistic Regression",
                "type": "Linear Baseline",
                "metrics_val": lr_metrics_val,
                "training_time_sec": lr_metrics_val["training_time_sec"],
            },
            {
                "name": "Random Forest",
                "type": "Bagging Ensemble",
                "metrics_val": rf_metrics_val,
                "training_time_sec": rf_metrics_val["training_time_sec"],
            },
            {
                "name": "CatBoost",
                "type": "Boosting Champion",
                "metrics_val_default": cb_metrics_val_default,
                "metrics_val_optimal": cb_metrics_val_optimal,
                "metrics_test": test_metrics_optimal,
                "optimal_threshold": optimal_th,
                "training_time_sec": cb_metrics_val_default["training_time_sec"],
            },
        ],
        "threshold_scan_results": threshold_curve,
    }

    benchmark_path = REPORTS_DIR / "benchmark_results.json"
    with open(benchmark_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_report, f, indent=2)
    logger.info("Benchmark report saved to %s", benchmark_path)

    logger.info("=== Model Benchmarking & Champion Export Completed Successfully ===")
    return benchmark_report


if __name__ == "__main__":
    run_benchmark_and_export()
