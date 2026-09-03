#!/usr/bin/env bash
set -e

echo "=== [1/4] Creating Directory Skeleton ==="
mkdir -p backend/app/api backend/app/schemas backend/app/services backend/app/ml/models/champion backend/tests
mkdir -p frontend/app frontend/components frontend/lib frontend/types frontend/public
mkdir -p ml/notebooks ml/experiments ml/reports
mkdir -p data/raw data/processed data/sample data/outputs
mkdir -p reports/benchmark

echo "=== [2/4] Initializing Python Virtual Environment ==="
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "=== [3/4] Initializing CSV Log File ==="
if [ ! -f "data/outputs/prediction_logs.csv" ]; then
  echo "timestamp,request_id,row_id,probability,risk_label,model_name,model_version,status" > data/outputs/prediction_logs.csv
fi

echo "=== [4/4] Running Quality Check (Ruff & Pytest) ==="
cd backend
ruff check .
pytest
cd ..

echo "=== Stage 1 Setup Completed Successfully! ==="
