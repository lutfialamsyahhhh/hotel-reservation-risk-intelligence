$ErrorActionPreference = "Stop"

Write-Host "=== [1/4] Creating Directory Skeleton ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path `
  "backend\app\api", "backend\app\schemas", "backend\app\services", "backend\app\ml\models\champion", "backend\tests", `
  "frontend\app", "frontend\components", "frontend\lib", "frontend\types", "frontend\public", `
  "ml\notebooks", "ml\experiments", "ml\reports", `
  "data\raw", "data\processed", "data\sample", "data\outputs", `
  "reports\benchmark" | Out-Null

Write-Host "=== [2/4] Initializing Python Virtual Environment ===" -ForegroundColor Cyan
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

Write-Host "=== [3/4] Initializing CSV Log File ===" -ForegroundColor Cyan
$logPath = "data\outputs\prediction_logs.csv"
if (-not (Test-Path $logPath)) {
    "timestamp,request_id,row_id,probability,risk_label,model_name,model_version,status" | Out-File -FilePath $logPath -Encoding utf8
}

Write-Host "=== [4/4] Running Quality Check (Ruff & Pytest) ===" -ForegroundColor Cyan
Set-Location backend
ruff check .
pytest
Set-Location ..

Write-Host "=== Stage 1 Setup Completed Successfully! ===" -ForegroundColor Green
