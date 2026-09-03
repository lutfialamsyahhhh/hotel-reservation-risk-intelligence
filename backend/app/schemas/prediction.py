"""Pydantic schemas for single and bulk hotel booking cancellation predictions."""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class SingleBookingInput(BaseModel):
    """Input schema for predicting cancellation risk of a single hotel reservation."""

    hotel: str = Field("City Hotel", description="Hotel type: 'City Hotel' or 'Resort Hotel'")
    lead_time: int = Field(..., ge=0, description="Lead time in days before arrival")
    arrival_date_year: int = Field(..., ge=2015, le=2030, description="Year of arrival")
    arrival_date_month: str = Field(..., description="Month of arrival (e.g. 'July')")
    arrival_date_week_number: int = Field(..., ge=1, le=53, description="Week number")
    arrival_date_day_of_month: int = Field(..., ge=1, le=31, description="Day of arrival")
    stays_in_weekend_nights: int = Field(0, ge=0, description="Weekend nights stayed")
    stays_in_week_nights: int = Field(0, ge=0, description="Week nights stayed")
    adults: int = Field(1, ge=0, description="Number of adults")
    children: float = Field(0.0, ge=0.0, description="Number of children")
    babies: int = Field(0, ge=0, description="Number of babies")
    meal: str = Field("BB", description="Meal booked")
    country: str = Field("Unknown", description="Country of origin")
    market_segment: str = Field("Online TA", description="Market segment")
    distribution_channel: str = Field("TA/TO", description="Distribution channel")
    is_repeated_guest: int = Field(0, ge=0, le=1, description="1 if repeated guest, 0 otherwise")
    previous_cancellations: int = Field(0, ge=0, description="Previous bookings cancelled")
    previous_bookings_not_canceled: int = Field(0, ge=0, description="Previous not-cancelled")
    reserved_room_type: str = Field("A", description="Reserved room type")
    assigned_room_type: str = Field("A", description="Assigned room type")
    booking_changes: int = Field(0, ge=0, description="Booking changes count")
    deposit_type: str = Field("No Deposit", description="Deposit type")
    days_in_waiting_list: int = Field(0, ge=0, description="Days in waiting list")
    customer_type: str = Field("Transient", description="Type of customer")
    adr: float = Field(..., ge=0.0, description="Average Daily Rate")
    required_car_parking_spaces: int = Field(0, ge=0, description="Parking spaces needed")
    total_of_special_requests: int = Field(0, ge=0, description="Special requests count")

    @field_validator("country")
    @classmethod
    def sanitize_country(cls, v: str) -> str:
        clean = v.strip().upper() if isinstance(v, str) else "Unknown"
        return clean if clean else "Unknown"

    @field_validator(
        "hotel",
        "meal",
        "market_segment",
        "distribution_channel",
        "deposit_type",
        "customer_type",
    )
    @classmethod
    def sanitize_categorical_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) and v.strip() else "Unknown"


class PredictionResponse(BaseModel):
    """Response schema for single booking cancellation risk prediction."""

    request_id: str
    probability: float
    risk_label: Literal["Rendah", "Sedang", "Tinggi"]
    threshold_used: float
    model_name: str
    model_version: str
    is_canceled_prediction: int


class BulkPredictionRowResult(BaseModel):
    """Prediction outcome for an individual row in a bulk batch."""

    row_id: int
    probability: float
    risk_label: Literal["Rendah", "Sedang", "Tinggi"]
    is_canceled_prediction: int
    key_summary: dict[str, Any]


class BulkRiskDistribution(BaseModel):
    """Risk distribution summary across a batch of predictions."""

    low_count: int
    medium_count: int
    high_count: int
    cancellation_rate_predicted: float


class BulkPredictionResponse(BaseModel):
    """Aggregate response schema for batch CSV predictions."""

    total_rows_processed: int
    execution_time_ms: float
    risk_distribution: BulkRiskDistribution
    results: list[BulkPredictionRowResult]
