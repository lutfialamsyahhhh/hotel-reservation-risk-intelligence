"""FastAPI entrypoint and application configuration."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router as api_router
from app.services.logging_service import prediction_logger
from app.services.model_service import model_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("hotel_cancellation_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler: initialize model artifacts and verify CSV log storage on startup."""
    logger.info("Application starting up... Initializing locks & verifying assets.")
    try:
        prediction_logger.ensure_log_file()
        if not model_service.is_loaded:
            model_service.load_artifacts()
        logger.info("Model and logging services successfully initialized.")
    except Exception as e:
        logger.warning("Startup warning: %s", e)
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title="Hotel Booking Cancellation Risk Prediction API",
    version="1.0.0",
    description="API for hotel booking cancellation risk scoring (SDG 8 MVP)",
    lifespan=lifespan,
)

# Robust CORS Origins from env or standard defaults
raw_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,*",
)
allowed_origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints router
app.include_router(api_router)
