"""Data Preprocessing and Leakage-Free Splitting Pipeline.

SDG 8 MVP: Hotel Booking Cancellation Risk Prediction.
"""

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("data_preprocessing")

EXPECTED_RAW_COLUMNS = [
    "hotel",
    "is_canceled",
    "lead_time",
    "arrival_date_year",
    "arrival_date_month",
    "arrival_date_week_number",
    "arrival_date_day_of_month",
    "stays_in_weekend_nights",
    "stays_in_week_nights",
    "adults",
    "children",
    "babies",
    "meal",
    "country",
    "market_segment",
    "distribution_channel",
    "is_repeated_guest",
    "previous_cancellations",
    "previous_bookings_not_canceled",
    "reserved_room_type",
    "assigned_room_type",
    "booking_changes",
    "deposit_type",
    "agent",
    "company",
    "days_in_waiting_list",
    "customer_type",
    "adr",
    "required_car_parking_spaces",
    "total_of_special_requests",
    "reservation_status",
    "reservation_status_date",
    "name",
    "email",
    "phone-number",
    "credit_card",
]

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

LEAKAGE_AND_EXCLUDED_COLUMNS = [
    "name",
    "email",
    "phone-number",
    "credit_card",
    "reservation_status",
    "reservation_status_date",
    "company",
    "agent",
]

NUMERICAL_FEATURES = [
    "lead_time",
    "arrival_year",
    "arrival_month_num",
    "arrival_week_number",
    "arrival_day",
    "stays_in_weekend_nights",
    "stays_in_week_nights",
    "total_stay_nights",
    "adults",
    "children",
    "babies",
    "total_guests",
    "is_repeated_guest",
    "previous_cancellations",
    "previous_bookings_not_canceled",
    "previous_booking_activity",
    "previous_cancellation_rate",
    "booking_changes",
    "days_in_waiting_list",
    "adr",
    "required_car_parking_spaces",
    "total_of_special_requests",
    "is_weekend_arrival",
]

CATEGORICAL_FEATURES = [
    "hotel",
    "meal",
    "country",
    "market_segment",
    "distribution_channel",
    "reserved_room_type",
    "assigned_room_type",
    "deposit_type",
    "customer_type",
]

TARGET_COLUMN = "is_canceled"


def clean_raw_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean raw dataset anomalies and handle missing values.

    - Validates presence of expected raw columns.
    - Handles negative ADR by converting to NaN and imputing with hotel-level median.
    - Fills missing 'country' with 'Unknown'.
    - Fills missing 'children' with 0.
    - Drops anomalous records where adults == 0 and children == 0 and babies == 0.
    """
    logger.info("Cleaning raw dataset anomalies...")
    data = df.copy()

    # Validate raw schema
    missing_expected = set(EXPECTED_RAW_COLUMNS) - set(data.columns)
    if missing_expected:
        raise ValueError(f"Raw data is missing expected columns: {missing_expected}")

    # Handle ADR anomalies (< 0)
    negative_adr_mask = data["adr"] < 0
    if negative_adr_mask.any():
        neg_count = negative_adr_mask.sum()
        logger.info("Found %d negative ADR record(s). Imputing with hotel median.", neg_count)
        data.loc[negative_adr_mask, "adr"] = np.nan
        data["adr"] = data.groupby("hotel")["adr"].transform(
            lambda s: s.fillna(s.median())
        )

    # Handle missing values in country and children
    data["country"] = data["country"].fillna("Unknown").astype(str)
    data["children"] = data["children"].fillna(0).astype(int)

    # Drop zero-guest anomaly bookings (adults == 0 & children == 0 & babies == 0)
    zero_guests_mask = (data["adults"] == 0) & (data["children"] == 0) & (data["babies"] == 0)
    dropped_zero_guests = zero_guests_mask.sum()
    if dropped_zero_guests > 0:
        logger.info("Dropping %d zero-guest anomaly record(s).", dropped_zero_guests)
        data = data.loc[~zero_guests_mask].reset_index(drop=True)

    return data


def drop_unusable_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Drop artificial identifiers, outcome/leakage columns, and high-missing anonymous identifiers."""
    logger.info("Dropping artificial, leakage, and unusable identifier columns...")
    cols_to_drop = [c for c in LEAKAGE_AND_EXCLUDED_COLUMNS if c in df.columns]
    return df.drop(columns=cols_to_drop)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Perform domain feature engineering and time normalization."""
    logger.info("Engineering domain features and normalizing time representations...")
    data = df.copy()

    # Total stay duration & Total guest capacity
    data["total_stay_nights"] = (
        data["stays_in_weekend_nights"] + data["stays_in_week_nights"]
    ).astype(int)
    data["total_guests"] = (data["adults"] + data["children"] + data["babies"]).astype(int)

    # Normalized date features
    data["arrival_year"] = data["arrival_date_year"].astype(int)
    data["arrival_month_num"] = data["arrival_date_month"].map(MONTH_MAP).astype(int)
    data["arrival_week_number"] = data["arrival_date_week_number"].astype(int)
    data["arrival_day"] = data["arrival_date_day_of_month"].astype(int)

    # Weekend arrival calculation
    date_str_series = (
        data["arrival_year"].astype(str)
        + "-"
        + data["arrival_month_num"].astype(str).str.zfill(2)
        + "-"
        + data["arrival_day"].astype(str).str.zfill(2)
    )
    arrival_dates = pd.to_datetime(date_str_series, errors="coerce")
    data["is_weekend_arrival"] = (arrival_dates.dt.dayofweek >= 5).astype(int)

    # Historical cancellation activity and rate with zero-division protection
    data["previous_booking_activity"] = (
        data["previous_cancellations"] + data["previous_bookings_not_canceled"]
    ).astype(int)

    data["previous_cancellation_rate"] = np.where(
        data["previous_booking_activity"] > 0,
        data["previous_cancellations"] / data["previous_booking_activity"],
        0.0,
    ).astype(float)

    # Drop old arrival date columns replaced by normalized features
    old_date_cols = [
        "arrival_date_year",
        "arrival_date_month",
        "arrival_date_week_number",
        "arrival_date_day_of_month",
    ]
    data = data.drop(columns=[c for c in old_date_cols if c in data.columns])

    # Reorder columns: Numerical Features + Categorical Features + Target
    ordered_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
    if TARGET_COLUMN in data.columns:
        ordered_cols.append(TARGET_COLUMN)

    return data[ordered_cols]


def split_dataset(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Perform stratified split into Train (70%), Validation (15%), and Test (15%)."""
    logger.info("Executing stratified train/val/test splitting...")
    if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
        raise ValueError("Train, Val, and Test ratios must sum to 1.0.")

    y = df[TARGET_COLUMN]
    temp_ratio = val_ratio + test_ratio

    # Step 1: Train (70%) vs Temp (30%)
    train_df, temp_df = train_test_split(
        df,
        test_size=temp_ratio,
        random_state=random_state,
        stratify=y,
    )

    # Step 2: Temp (30%) -> Val (15%) vs Test (15%)
    val_proportion_in_temp = val_ratio / temp_ratio  # 0.15 / 0.30 = 0.50
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - val_proportion_in_temp),
        random_state=random_state,
        stratify=temp_df[TARGET_COLUMN],
    )

    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    return train_df, val_df, test_df


def build_metadata(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> dict[str, Any]:
    """Generate comprehensive feature and split metadata dictionary."""
    total_rows = len(train_df) + len(val_df) + len(test_df)
    return {
        "target": TARGET_COLUMN,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "split_info": {
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df),
            "total_rows": total_rows,
            "cancellation_rate_train": round(float(train_df[TARGET_COLUMN].mean()), 4),
            "cancellation_rate_val": round(float(val_df[TARGET_COLUMN].mean()), 4),
            "cancellation_rate_test": round(float(test_df[TARGET_COLUMN].mean()), 4),
        },
    }


def run_pipeline(
    raw_data_path: str = "data/raw/hotel_booking.csv",
    output_dir: str = "data/processed",
) -> dict[str, Any]:
    """Execute complete data preprocessing pipeline and save processed splits and metadata."""
    raw_path = Path(raw_data_path)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    logger.info("Loading raw dataset from %s...", raw_path)
    raw_df = pd.read_csv(raw_path)
    logger.info("Raw dataset shape: %s", raw_df.shape)

    # 1. Clean anomalies & missing values
    cleaned_df = clean_raw_data(raw_df)

    # 2. Drop leakage, artificial, and unusable columns
    filtered_df = drop_unusable_columns(cleaned_df)

    # 3. Feature engineering
    engineered_df = engineer_features(filtered_df)
    logger.info("Processed dataset shape before split: %s", engineered_df.shape)

    # 4. Stratified Split
    train_df, val_df, test_df = split_dataset(engineered_df)

    # 5. Export processed datasets (Parquet & CSV)
    logger.info("Saving train, val, and test splits in Parquet and CSV formats...")
    train_df.to_parquet(out_path / "train.parquet", index=False)
    train_df.to_csv(out_path / "train.csv", index=False)

    val_df.to_parquet(out_path / "val.parquet", index=False)
    val_df.to_csv(out_path / "val.csv", index=False)

    test_df.to_parquet(out_path / "test.parquet", index=False)
    test_df.to_csv(out_path / "test.csv", index=False)

    # 6. Export metadata JSON
    metadata = build_metadata(train_df, val_df, test_df)
    metadata_file = out_path / "feature_metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Feature metadata saved to %s", metadata_file)

    logger.info("=== Data Preprocessing Pipeline Completed Successfully ===")
    logger.info(
        "Train: %d rows (Cancel Rate: %.2f%%)",
        metadata["split_info"]["train_rows"],
        metadata["split_info"]["cancellation_rate_train"] * 100,
    )
    logger.info(
        "Val: %d rows (Cancel Rate: %.2f%%)",
        metadata["split_info"]["val_rows"],
        metadata["split_info"]["cancellation_rate_val"] * 100,
    )
    logger.info(
        "Test: %d rows (Cancel Rate: %.2f%%)",
        metadata["split_info"]["test_rows"],
        metadata["split_info"]["cancellation_rate_test"] * 100,
    )

    return metadata


if __name__ == "__main__":
    run_pipeline()
