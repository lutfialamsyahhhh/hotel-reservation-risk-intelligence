"""Integration tests for FastAPI REST API endpoints, guardrails, and concurrent logging."""

import asyncio
import io
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.logging_service import LOG_FILE_PATH

client = TestClient(app)

SAMPLE_VALID_PAYLOAD = {
    "hotel": "City Hotel",
    "lead_time": 60,
    "arrival_date_year": 2017,
    "arrival_date_month": "August",
    "arrival_date_week_number": 33,
    "arrival_date_day_of_month": 15,
    "stays_in_weekend_nights": 1,
    "stays_in_week_nights": 2,
    "adults": 2,
    "children": 0,
    "babies": 0,
    "meal": "BB",
    "country": "PRT",
    "market_segment": "Online TA",
    "distribution_channel": "TA/TO",
    "is_repeated_guest": 0,
    "previous_cancellations": 0,
    "previous_bookings_not_canceled": 0,
    "reserved_room_type": "A",
    "assigned_room_type": "A",
    "booking_changes": 0,
    "deposit_type": "No Deposit",
    "days_in_waiting_list": 0,
    "customer_type": "Transient",
    "adr": 115.0,
    "required_car_parking_spaces": 0,
    "total_of_special_requests": 1,
}


def test_health_endpoint():
    """Verify health endpoint returns status healthy and model is loaded."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["optimal_threshold"] == 0.54


def test_benchmark_endpoint():
    """Verify /models/benchmark returns complete benchmark report."""
    response = client.get("/models/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert data["champion"] == "CatBoost"
    model_names = [m["name"] for m in data["models"]]
    assert "CatBoost" in model_names
    assert "Random Forest" in model_names
    assert "Logistic Regression" in model_names


def test_single_prediction_valid():
    """Verify single booking prediction returns valid probability and risk label."""
    response = client.post("/predict", json=SAMPLE_VALID_PAYLOAD)
    assert response.status_code == 200
    data = response.json()

    assert "request_id" in data
    assert data["request_id"].startswith("req-")
    assert 0.0 <= data["probability"] <= 1.0
    assert data["risk_label"] in ["Rendah", "Sedang", "Tinggi"]
    assert data["threshold_used"] == 0.54
    assert data["is_canceled_prediction"] in [0, 1]


def test_single_prediction_invalid_payload():
    """Verify 422 error is returned when required fields or validation bounds are violated."""
    invalid_payload = SAMPLE_VALID_PAYLOAD.copy()
    invalid_payload["lead_time"] = -10  # Must be >= 0

    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422


def test_bulk_prediction_valid_file():
    """Verify bulk prediction parses CSV and returns structured array of row outcomes."""
    # Create sample CSV in-memory with 10 rows
    header = (
        "hotel,lead_time,arrival_date_year,arrival_date_month,arrival_date_week_number,"
        "arrival_date_day_of_month,stays_in_weekend_nights,stays_in_week_nights,adults,"
        "children,babies,meal,country,market_segment,distribution_channel,is_repeated_guest,"
        "previous_cancellations,previous_bookings_not_canceled,reserved_room_type,"
        "assigned_room_type,booking_changes,deposit_type,days_in_waiting_list,customer_type,"
        "adr,required_car_parking_spaces,total_of_special_requests\n"
    )
    row = (
        "City Hotel,30,2017,July,28,10,1,2,2,0,0,BB,PRT,Online TA,TA/TO,0,0,0,A,A,0,"
        "No Deposit,0,Transient,100.0,0,1\n"
    )
    csv_content = header + (row * 10)

    files = {"file": ("test_batch.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/predict/bulk", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_rows_processed"] == 10
    assert len(data["results"]) == 10
    assert "risk_distribution" in data
    total_risks = (
        data["risk_distribution"]["low_count"]
        + data["risk_distribution"]["medium_count"]
        + data["risk_distribution"]["high_count"]
    )
    assert total_risks == 10


def test_bulk_prediction_exceeds_5mb():
    """Verify backend enforces 5 MB file size hard limit and rejects with HTTP 400."""
    # Generate ~5.5 MB dummy content
    large_content = b"x" * (6 * 1024 * 1024)
    files = {"file": ("large_file.csv", io.BytesIO(large_content), "text/csv")}

    response = client.post("/predict/bulk", files=files)
    assert response.status_code == 400
    assert "5 MB" in response.json()["detail"]


def test_bulk_prediction_exceeds_10000_rows():
    """Verify backend enforces 10,000 rows hard limit and rejects with HTTP 400."""
    header = (
        "hotel,lead_time,arrival_date_year,arrival_date_month,arrival_date_week_number,"
        "arrival_date_day_of_month,stays_in_weekend_nights,stays_in_week_nights,adults,"
        "children,babies,meal,country,market_segment,distribution_channel,is_repeated_guest,"
        "previous_cancellations,previous_bookings_not_canceled,reserved_room_type,"
        "assigned_room_type,booking_changes,deposit_type,days_in_waiting_list,customer_type,"
        "adr,required_car_parking_spaces,total_of_special_requests\n"
    )
    row = (
        "City Hotel,30,2017,July,28,10,1,2,2,0,0,BB,PRT,Online TA,TA/TO,0,0,0,A,A,0,"
        "No Deposit,0,Transient,100.0,0,1\n"
    )
    # 10,001 rows
    csv_content = header + (row * 10001)

    files = {"file": ("overflow.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/predict/bulk", files=files)

    assert response.status_code == 400
    assert "10.000 baris" in response.json()["detail"]


@pytest.mark.asyncio
async def test_concurrent_logging_integrity():
    """Verify 25 simultaneous concurrent prediction requests succeed without log file corruption."""
    log_path = Path(LOG_FILE_PATH)

    # Record initial line count
    initial_lines = 0
    if log_path.exists():
        with open(log_path, encoding="utf-8") as f:
            initial_lines = len(f.readlines())

    num_requests = 25

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        tasks = [ac.post("/predict", json=SAMPLE_VALID_PAYLOAD) for _ in range(num_requests)]
        responses = await asyncio.gather(*tasks)

    # Verify all requests succeeded with 200
    for resp in responses:
        assert resp.status_code == 200
        assert "request_id" in resp.json()

    # Verify prediction_logs.csv increased by exactly 25 lines
    with open(log_path, encoding="utf-8") as f:
        final_lines = len(f.readlines())

    assert final_lines == initial_lines + num_requests, (
        f"Expected {initial_lines + num_requests} lines, got {final_lines}"
    )
