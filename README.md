# Hotel Reservation Risk Intelligence (SDG 8 MVP)

[![Python 3.9+](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.1.3%20(App%20Router)-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CatBoost](https://img.shields.io/badge/CatBoost-Native%20GPU%20(.cbm)-FFCC00.svg?logo=catboost&logoColor=black)](https://catboost.ai/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Pytest](https://img.shields.io/badge/Pytest-20%2F20%20Passed%20(100%25)-brightgreen.svg?logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![Ruff](https://img.shields.io/badge/Linter-Ruff%20%26%20ESLint%20Clean-000000.svg?logo=ruff&logoColor=white)](https://github.com/astral-sh/ruff)
[![SDG 8](https://img.shields.io/badge/SDG%208-Decent%20Work%20%26%20Economic%20Growth-A21942.svg)](https://sdgs.un.org/goals/goal8)

Platform intelijen prediktif berbasis *Machine Learning* untuk mengantisipasi risiko pembatalan reservasi hotel secara *real-time* maupun pemrosesan *batch* CSV skala besar. Mengusung arsitektur **Decoupled Monorepo** kelas industri yang menggabungkan model *Champion* **CatBoost Classifier (.cbm)** berakurasi tinggi dengan antarmuka web modern **Next.js 14** dan REST API performa tinggi **FastAPI**.

---

## 📌 Gambaran Umum & Nilai Bisnis

* **Tantangan Industri Perhotelan**: Pembatalan reservasi historis mencapai **37,08%** (44.224 dari 119.210 reservasi). Pembatalan mendadak memicu kamar kosong (*unoccupied room loss*), menggerus *Average Daily Rate (ADR)* dan *RevPAR*, serta mendorong praktik *blind overbooking* spekulatif yang berujung pada penolakan tamu yang hadir (*bumping guests*).
* **Solusi Berbasis AI**: Sistem memetakan 32 karakteristik pemesanan menjadi estimasi probabilitas pembatalan terkalibrasi ($0,0 - 1,0$), menetapkan **ambang batas keputusan optimal $\theta^* = 0,54$** (F1-Score: **83,27%**, Recall: **85,04%**, ROC-AUC: **0,9470**), dan mengelompokkan risiko ke dalam 3 zona operasional:
  * 🟢 **Risiko Rendah ($< 35\%$)**: Konfirmasi standar & penuhi preferensi kamar.
  * 🟡 **Risiko Sedang ($35\% - 53\%$)**: Kirimkan email pengingat ramah & tawarkan promosi *add-on*.
  * 🔴 **Risiko Tinggi ($\ge 54\%$)**: Konfirmasi ulang deposit/kartu jaminan & siapkan kuota *overbooking buffer* terukur.
* **Korelasi SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi)**:
  * **Target 8.2**: Optimalisasi produktivitas dan proteksi pendapatan kamar hotel.
  * **Target 8.8**: Mengeliminasi stres kerja staf meja depan (*front-desk*) akibat konflik penolakan tamu yang tidak terencana.

---

## 🏛️ Arsitektur Sistem Monorepo

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        HOTEL RISK INTELLIGENCE MONOREPO                                │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│ FRONTEND LAYER (Port 3000 / 3001)        │ BACKEND ENGINE LAYER (Port 8000)            │
│ • Next.js 14 App Router + React 18       │ • FastAPI REST API Framework                │
│ • TypeScript Strict Type-Safety          │ • CatBoost Native Binary (.cbm: 3.97 MB)    │
│ • Tailwind CSS & Recharts Obsidian Dark  │ • Pydantic V2 Contract Validation           │
│ • Responsive Single & Bulk Ingestion     │ • Thread-Safe CSV Logging (asyncio.Lock)    │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
                                  │                     │
                    HTTP REST API │ (JSON / Multipart)  │ File-Based Ingestion
                                  ▼                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DATA & REPRODUCIBILITY LAYER                                                           │
│ • data/raw/             : Dataset asli Hotel Booking Demand (119.390 baris)            │
│ • data/processed/       : 119.210 data bersih (Split 70% Train, 15% Val, 15% Test)    │
│ • data/sample/          : template_hotel_bookings_batch.csv untuk pengujian demo       │
│ • data/outputs/         : prediction_logs.csv (Append-only thread-safe audit log)      │
│ • backend/.../champion/ : catboost_model.cbm + model_metadata.json                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Struktur Direktori Proyek

```text
hotel-booking-cancellation/
├── frontend/                         # Next.js 14 Client Application
│   ├── app/                          # Layout, Pages, & Global Tailwind CSS
│   ├── components/                   # Navbar, OverviewTab, BenchmarkTab, SinglePredictionTab, BulkPredictionTab, Footer
│   ├── lib/                          # API Client & Healthcheck Service
│   ├── types/                        # TypeScript Interfaces
│   ├── public/                       # Static Assets & Template CSV
│   └── package.json                  # Frontend Dependencies & Scripts
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                      # REST Endpoints (/health, /predict, /predict/bulk, /models/benchmark)
│   │   ├── schemas/                  # Pydantic Ingestion & Response Models
│   │   ├── services/                 # ModelInferenceService & AsyncPredictionLogger
│   │   ├── ml/models/champion/       # Champion Artifact (catboost_model.cbm & model_metadata.json)
│   │   └── main.py                   # Lifespan Handler, CORS, & App Setup
│   ├── tests/                        # 20 Pytest Test Cases (100% Passed)
│   ├── pyproject.toml                # Ruff Linter & Pytest Config
│   └── requirements.txt              # Pinned Python Dependencies
├── ml/                               # Machine Learning Experiments
│   ├── experiments/                  # Preprocessing, Benchmarking, & Stress-Test Scripts
│   └── reports/                      # Benchmark Results & Evaluations
├── data/                             # Data Assets & File-Based Storage
│   ├── raw/                          # Raw CSV Dataset
│   ├── processed/                    # Clean Parquet Splits & feature_metadata.json
│   ├── sample/                       # template_hotel_bookings_batch.csv
│   └── outputs/                      # prediction_logs.csv
├── .env.example                      # Environment Configuration Template
├── .gitignore                        # Git Track Exclusion Rules
└── README.md                         # Enterprise Project Documentation
```

---

## 🚀 Panduan Instalasi & Menjalankan (Quick Start Guide)

Proyek ini bersifat *plug-and-play* dan dapat dijalankan langsung di mesin lokal baru tanpa kesalahan konfigurasi.

### 1. Prasyarat Sistem
* **Python**: Versi `3.9`, `3.10`, `3.11`, atau `3.12`
* **Node.js**: Versi `18.x` atau `20.x` LTS (disertai `npm`)
* **Git**: Versi terbaru

### 2. Kloning Repositori
```bash
git clone https://github.com/your-org/hotel-booking-cancellation.git
cd hotel-booking-cancellation
```

### 3. Menjalankan Backend (FastAPI Engine)
Buka terminal baru di folder root proyek:

```bash
# 1. Buat dan aktifkan virtual environment
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# 2. Install dependensi Python
pip install --upgrade pip
pip install -r backend/requirements.txt

# 3. Jalankan server FastAPI Uvicorn
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> **Backend API aktif di:** `http://127.0.0.1:8000`  
> **Swagger UI Dokumentasi Interaktif:** `http://127.0.0.1:8000/docs`

### 4. Menjalankan Frontend (Next.js 14 Dashboard)
Buka terminal kedua di folder root proyek:

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install dependensi Node.js
npm install

# 3. Jalankan development server
npm run dev
```
> **Dashboard Web aktif di:** `http://localhost:3000` (atau `http://localhost:3001`)

---

## 📡 Dokumentasi Endpoint REST API

| Endpoint | Metode | Deskripsi | Input Utama | Respon Utama |
|---|:---:|---|---|---|
| `/health` | `GET` | Memeriksa kesiapan service backend, model ML, dan file log | - | `status: "healthy"`, `model_loaded: true` |
| `/models/benchmark` | `GET` | Mengambil matriks komparasi 3 model dan kurva threshold | - | Ringkasan metrik F1, Recall, ROC-AUC, CM |
| `/predict` | `POST` | Inferensi prediktif *real-time* untuk satu data reservasi | JSON payload (26 atribut) | `probability`, `risk_label`, `request_id` |
| `/predict/bulk` | `POST` | Pemrosesan batch file CSV (Guardrail maks 5 MB / 10.000 baris) | Multipart File (`.csv`) | Distribusi risiko batch, latensi ms, tabel baris |

---

## 🧪 Verifikasi Kualitas & Quality Gates (100% Passed)

Repositori ini telah melewati seluruh *Quality Gates* otomatis untuk memastikan kestabilan produksi:

```bash
# 1. Menjalankan 20 Skenario Pengujian Pytest (Backend)
pytest backend/tests/ -v
# Hasil: 20 passed in 8.5s (100% PASS)

# 2. Menjalankan Audit Linter Ruff (Backend & ML Scripts)
ruff check backend/ ml/
# Hasil: All checks passed! (0 errors, 0 warnings)

# 3. Menjalankan TypeScript Strict Type-Check (Frontend)
cd frontend && npm run type-check
# Hasil: tsc --noEmit (0 errors)

# 4. Menjalankan ESLint (Frontend)
cd frontend && npm run lint
# Hasil: No ESLint warnings or errors

# 5. Menjalankan Kompilasi Build Produksi Next.js
cd frontend && npm run build
# Hasil: Compiled successfully (Static Pages Ready)
```

---

## 📊 Tolok Ukur Model Machine Learning

Hasil evaluasi objektif pada **Validation Set (17.881 baris)** dan **Held-Out Test Set (17.882 baris)**:

| Model & Filosofi | F1-Score (Val) | Recall (Cancel) | Precision | ROC-AUC | PR-AUC | Status Seleksi |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** *(Linear)* | 75.26% | 78.10% | 72.61% | 0.8957 | 0.8587 | *Baseline* |
| **Random Forest** *(Bagging)* | 80.57% | 80.32% | 80.82% | 0.9333 | 0.9070 | *Challenger* |
| **CatBoost Classifier** *(Boosting)* | **83.27%** | **85.04%** | **81.58%** | **0.9470** | **0.9242** | 🏆 **CHAMPION** |

* **Held-Out Test Set Generalization**: Akurasi **87.31%**, F1-Score **83.13%**, Recall **84.36%**, ROC-AUC **0.9473**.
* **Confusion Matrix (Test Set: 17.882 baris)**:
  * True Negative (TN): **10.019**
  * True Positive (TP): **5.593** (Berhasil mendeteksi 84,36% dari 6.630 pembatalan aktual)
  * False Positive (FP): **1.233**
  * False Negative (FN): **1.037**
* **Top 5 Feature Importance**: `lead_time` (21.4%), `country` (18.2%), `deposit_type` (12.8%), `market_segment` (8.7%), `previous_cancellation_rate` (7.9%).

---

## 🛡️ Limitasi Model & Protokol Human-in-the-Loop (HITL)

1. **Variabel Konfounder Eksternal**: Model dilatih berdasarkan 32 atribut historis saat reservasi dibuat. Model memiliki titik buta terhadap disrupsi eksternal mendadak (cuaca ekstrem, pembatalan penerbangan, diskon mendadak hotel kompetitor, atau keadaan darurat pribadi tamu).
2. **Data & Concept Drift**: Model memiliki masa guna efektif **3 hingga 6 bulan** dan wajib dilatih ulang (*periodic retraining*) jika terjadi perubahan regulasi pembatalan OTA atau pergeseran tren musiman.
3. **Prinsip "AI Recommends, Human Decides"**: Sistem bertindak sebagai pendukung keputusan (*Decision Support System*). Sistem dilarang membatalkan kamar secara otomatis tanpa konfirmasi staf hotel.
4. **Kebijakan Overbooking Terkendali**: Alokasi *overbooking buffer* dibatasi maksimal **3% - 5% dari kapasitas hotel**, tidak boleh diterapkan 1:1 terhadap angka prediksi risiko tinggi guna mencegah penolakan tamu (*bumping guests*).

---

## 👥 Tim Pengembang & Hak Cipta

Proyek ini dikembangkan dalam rangka **Project-Based Internship Program 2026** di **PT Vinix Seven Aurum**:

* **Muhammad Lutfi Alamsyah** — *Artificial Intelligence Intern*
* **Maudy Amalia** — *Artificial Intelligence Intern*

Hak Cipta © 2026 **PT Vinix Seven Aurum**. Seluruh Hak Cipta Dilindungi.  
Dilisensikan di bawah ketentuan [MIT License](LICENSE).
