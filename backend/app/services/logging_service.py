"""Thread-safe asynchronous prediction logging service using asyncio.Lock."""

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger("logging_service")

# Robust absolute path resolution
ROOT_DIR = Path(__file__).resolve().parents[3]
LOG_FILE_PATH = ROOT_DIR / "data" / "outputs" / "prediction_logs.csv"
CSV_HEADER = "timestamp,request_id,row_id,probability,risk_label,model_name,model_version,status\n"


class AsyncPredictionLogger:
    """Thread-safe prediction log persistence to CSV protected by asyncio.Lock."""

    _instance = None

    def __new__(cls) -> "AsyncPredictionLogger":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return

        self._locks: dict[int, asyncio.Lock] = {}
        self._log_path = LOG_FILE_PATH
        self.ensure_log_file()
        self._initialized = True

    def get_lock(self) -> asyncio.Lock:
        """Return an asyncio.Lock tied to the current running event loop."""
        loop = asyncio.get_running_loop()
        loop_id = id(loop)
        if loop_id not in self._locks:
            self._locks[loop_id] = asyncio.Lock()
        return self._locks[loop_id]

    def ensure_log_file(self) -> None:
        """Ensure parent directory exists and CSV file is initialized with proper header."""
        self._log_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._log_path.exists() or self._log_path.stat().st_size == 0:
            logger.info("Initializing prediction log file at %s...", self._log_path)
            with open(self._log_path, "w", encoding="utf-8") as f:
                f.write(CSV_HEADER)

    def _sync_append_line(self, line: str) -> None:
        with open(self._log_path, "a", encoding="utf-8") as f:
            f.write(line)

    def _sync_append_lines(self, lines: list[str]) -> None:
        with open(self._log_path, "a", encoding="utf-8") as f:
            f.writelines(lines)

    async def log_single_prediction(
        self,
        request_id: str,
        probability: float,
        risk_label: str,
        model_name: str,
        model_version: str,
        row_id: int = 1,
        status: str = "success",
    ) -> None:
        """Append a single prediction log entry inside critical section."""
        ts = datetime.now(timezone.utc).isoformat()
        line = (
            f"{ts},{request_id},{row_id},{probability:.4f},"
            f"{risk_label},{model_name},{model_version},{status}\n"
        )

        async with self.get_lock():
            await asyncio.to_thread(self._sync_append_line, line)

    async def log_bulk_predictions(
        self,
        request_id: str,
        batch_results: list[dict[str, Any]],
        model_name: str,
        model_version: str,
        status: str = "success",
    ) -> None:
        """Append multiple prediction logs in a single thread-safe batch operation."""
        ts = datetime.now(timezone.utc).isoformat()
        lines = []
        for item in batch_results:
            row_id = item.get("row_id", 1)
            prob = item.get("probability", 0.0)
            risk = item.get("risk_label", "Unknown")
            lines.append(
                f"{ts},{request_id},{row_id},{prob:.4f},"
                f"{risk},{model_name},{model_version},{status}\n"
            )

        if lines:
            async with self.get_lock():
                await asyncio.to_thread(self._sync_append_lines, lines)


prediction_logger = AsyncPredictionLogger()
