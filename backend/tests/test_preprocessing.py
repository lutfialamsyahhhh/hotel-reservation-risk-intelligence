"""Unit tests for Data Preprocessing and Leakage-Free Pipeline."""

import json
from pathlib import Path

import pandas as pd

from ml.experiments.data_preprocessing import (
    CATEGORICAL_FEATURES,
    LEAKAGE_AND_EXCLUDED_COLUMNS,
    NUMERICAL_FEATURES,
    TARGET_COLUMN,
    clean_raw_data,
    engineer_features,
)

ROOT_DIR = Path(__file__).resolve().parents[2]
PROCESSED_DIR = ROOT_DIR / "data" / "processed"


def test_no_leakage_columns_present():
    """Verify that none of the leakage, outcome, or artificial columns exist in processed data."""
    train_df = pd.read_parquet(PROCESSED_DIR / "train.parquet")
    val_df = pd.read_parquet(PROCESSED_DIR / "val.parquet")
    test_df = pd.read_parquet(PROCESSED_DIR / "test.parquet")

    for name, df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        found_leakage = [col for col in LEAKAGE_AND_EXCLUDED_COLUMNS if col in df.columns]
        assert not found_leakage, f"Found leakage columns in {name}: {found_leakage}"


def test_no_missing_values_in_critical_columns():
    """Verify that there are no NaN values across all columns in train, val, and test splits."""
    for split in ["train", "val", "test"]:
        df = pd.read_parquet(PROCESSED_DIR / f"{split}.parquet")
        null_counts = df.isnull().sum()
        cols_with_nulls = null_counts[null_counts > 0]
        assert cols_with_nulls.empty, f"Found nulls in {split}: {cols_with_nulls.to_dict()}"


def test_split_shapes_and_stratification():
    """Verify 70:15:15 split proportions and consistent target class balance across splits."""
    train_df = pd.read_parquet(PROCESSED_DIR / "train.parquet")
    val_df = pd.read_parquet(PROCESSED_DIR / "val.parquet")
    test_df = pd.read_parquet(PROCESSED_DIR / "test.parquet")

    total_rows = len(train_df) + len(val_df) + len(test_df)
    assert total_rows == 119210

    # Shape ratios within 0.1% tolerance
    assert abs(len(train_df) / total_rows - 0.70) < 0.001
    assert abs(len(val_df) / total_rows - 0.15) < 0.001
    assert abs(len(test_df) / total_rows - 0.15) < 0.001

    # Cancellation rate stratification consistency (within 0.5% tolerance)
    train_rate = train_df[TARGET_COLUMN].mean()
    val_rate = val_df[TARGET_COLUMN].mean()
    test_rate = test_df[TARGET_COLUMN].mean()

    assert abs(train_rate - val_rate) < 0.005
    assert abs(train_rate - test_rate) < 0.005


def test_zero_division_safety():
    """Verify previous_cancellation_rate defaults to 0.0 when previous_booking_activity is 0."""
    sample_df = pd.DataFrame(
        {
            "hotel": ["Resort Hotel", "City Hotel"],
            "is_canceled": [0, 1],
            "lead_time": [10, 20],
            "arrival_date_year": [2017, 2017],
            "arrival_date_month": ["July", "August"],
            "arrival_date_week_number": [27, 31],
            "arrival_date_day_of_month": [1, 15],
            "stays_in_weekend_nights": [1, 0],
            "stays_in_week_nights": [2, 3],
            "adults": [2, 1],
            "children": [0, 0],
            "babies": [0, 0],
            "meal": ["BB", "BB"],
            "country": ["PRT", "GBR"],
            "market_segment": ["Direct", "Online TA"],
            "distribution_channel": ["Direct", "TA/TO"],
            "is_repeated_guest": [0, 0],
            "previous_cancellations": [0, 0],
            "previous_bookings_not_canceled": [0, 0],
            "reserved_room_type": ["A", "B"],
            "assigned_room_type": ["A", "B"],
            "booking_changes": [0, 0],
            "deposit_type": ["No Deposit", "No Deposit"],
            "days_in_waiting_list": [0, 0],
            "customer_type": ["Transient", "Transient"],
            "adr": [100.0, 120.0],
            "required_car_parking_spaces": [0, 0],
            "total_of_special_requests": [0, 1],
        }
    )

    engineered = engineer_features(sample_df)
    assert (engineered["previous_booking_activity"] == 0).all()
    assert (engineered["previous_cancellation_rate"] == 0.0).all()


def test_feature_metadata_consistency():
    """Verify feature_metadata.json matches actual DataFrame schemas."""
    with open(PROCESSED_DIR / "feature_metadata.json", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["target"] == TARGET_COLUMN
    assert set(meta["numerical_features"]) == set(NUMERICAL_FEATURES)
    assert set(meta["categorical_features"]) == set(CATEGORICAL_FEATURES)

    train_df = pd.read_parquet(PROCESSED_DIR / "train.parquet")
    expected_cols = set(NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN])
    assert set(train_df.columns) == expected_cols


def test_clean_raw_data_negative_adr_and_zero_guests():
    """Verify anomaly cleaning logic on mock raw DataFrame."""
    raw_mock = pd.DataFrame(
        [
            {
                "hotel": "Resort Hotel",
                "is_canceled": 0,
                "lead_time": 5,
                "arrival_date_year": 2017,
                "arrival_date_month": "July",
                "arrival_date_week_number": 27,
                "arrival_date_day_of_month": 1,
                "stays_in_weekend_nights": 1,
                "stays_in_week_nights": 2,
                "adults": 0,
                "children": 0,
                "babies": 0,  # Zero guest anomaly
                "meal": "BB",
                "country": None,
                "market_segment": "Direct",
                "distribution_channel": "Direct",
                "is_repeated_guest": 0,
                "previous_cancellations": 0,
                "previous_bookings_not_canceled": 0,
                "reserved_room_type": "A",
                "assigned_room_type": "A",
                "booking_changes": 0,
                "deposit_type": "No Deposit",
                "agent": None,
                "company": None,
                "days_in_waiting_list": 0,
                "customer_type": "Transient",
                "adr": -10.0,  # Negative ADR anomaly
                "required_car_parking_spaces": 0,
                "total_of_special_requests": 0,
                "reservation_status": "Check-Out",
                "reservation_status_date": "2017-07-04",
                "name": "John Doe",
                "email": "john@example.com",
                "phone-number": "123",
                "credit_card": "456",
            },
            {
                "hotel": "Resort Hotel",
                "is_canceled": 0,
                "lead_time": 10,
                "arrival_date_year": 2017,
                "arrival_date_month": "July",
                "arrival_date_week_number": 27,
                "arrival_date_day_of_month": 2,
                "stays_in_weekend_nights": 0,
                "stays_in_week_nights": 2,
                "adults": 2,
                "children": None,  # Missing children
                "babies": 0,
                "meal": "BB",
                "country": None,  # Missing country
                "market_segment": "Direct",
                "distribution_channel": "Direct",
                "is_repeated_guest": 0,
                "previous_cancellations": 0,
                "previous_bookings_not_canceled": 0,
                "reserved_room_type": "A",
                "assigned_room_type": "A",
                "booking_changes": 0,
                "deposit_type": "No Deposit",
                "agent": None,
                "company": None,
                "days_in_waiting_list": 0,
                "customer_type": "Transient",
                "adr": 100.0,
                "required_car_parking_spaces": 0,
                "total_of_special_requests": 0,
                "reservation_status": "Check-Out",
                "reservation_status_date": "2017-07-04",
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phone-number": "789",
                "credit_card": "012",
            },
        ]
    )

    cleaned = clean_raw_data(raw_mock)
    # 1st row (zero guests) should be dropped
    assert len(cleaned) == 1
    # 2nd row: country should be 'Unknown', children should be 0
    assert cleaned.iloc[0]["country"] == "Unknown"
    assert cleaned.iloc[0]["children"] == 0
    assert cleaned.iloc[0]["adr"] == 100.0
