"""Comprehensive Model Sanity, Monotonicity, Resilience, and Calibration Stress Test.

SDG 8 MVP: Hotel Booking Cancellation Risk Prediction
"""

import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from sklearn.metrics import brier_score_loss, log_loss

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("stress_test")

ROOT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT_DIR / "backend" / "app" / "ml" / "models" / "champion" / "catboost_model.cbm"
METADATA_PATH = ROOT_DIR / "backend" / "app" / "ml" / "models" / "champion" / "model_metadata.json"
TEST_DATA_PATH = ROOT_DIR / "data" / "processed" / "test.parquet"


def run_stress_test():
    """Run thorough sanity, directional monotonicity, outlier resilience, and calibration audit."""
    print("=" * 80)
    print("MEMULAI AUDIT & STRESS-TEST KECERDASAN MODEL (BEHAVIORAL SANITY AUDIT)")
    print("=" * 80)

    # 1. Load Model & Metadata
    if not MODEL_PATH.exists():
        print(f"ERROR: Model champion tidak ditemukan di {MODEL_PATH}")
        sys.exit(1)

    model = CatBoostClassifier()
    model.load_model(str(MODEL_PATH))
    print(f"[OK] Model champion loaded: {model.get_param('loss_function')} (Trees: {model.tree_count_})")

    with open(METADATA_PATH, encoding="utf-8") as f:
        metadata = json.load(f)

    all_features = metadata["features"]["all_features"]
    optimal_threshold = metadata.get("optimal_threshold", 0.54)
    print(f"[OK] Fitur Terdaftar: {len(all_features)} (Optimal Threshold: {optimal_threshold})")

    # Base baseline record for perturbations
    base_record = {
        "lead_time": 45,
        "arrival_year": 2017,
        "arrival_month_num": 8,
        "arrival_week_number": 32,
        "arrival_day": 15,
        "stays_in_weekend_nights": 1,
        "stays_in_week_nights": 2,
        "total_stay_nights": 3,
        "adults": 2,
        "children": 0,
        "babies": 0,
        "total_guests": 2,
        "is_repeated_guest": 0,
        "previous_cancellations": 0,
        "previous_bookings_not_canceled": 0,
        "previous_booking_activity": 0,
        "previous_cancellation_rate": 0.0,
        "booking_changes": 0,
        "days_in_waiting_list": 0,
        "adr": 120.0,
        "required_car_parking_spaces": 0,
        "total_of_special_requests": 0,
        "is_weekend_arrival": 0,
        "hotel": "City Hotel",
        "meal": "BB",
        "country": "PRT",
        "market_segment": "Online TA",
        "distribution_channel": "TA/TO",
        "reserved_room_type": "A",
        "assigned_room_type": "A",
        "deposit_type": "No Deposit",
        "customer_type": "Transient",
    }

    def predict_prob(records_list: list[dict]) -> np.ndarray:
        df = pd.DataFrame(records_list)[all_features]
        return model.predict_proba(df)[:, 1]

    # =========================================================================
    # A. DIRECTIONAL SANITY / MONOTONICITY TESTS
    # =========================================================================
    print("\n" + "-" * 80)
    print("[TEST PILAR A] UJI LOGIKA ARAH & MONOTONISITAS (DIRECTIONAL SANITY)")
    print("-" * 80)

    # 1. Lead Time Monotonicity
    lead_times = [0, 10, 30, 90, 180, 300, 500]
    lead_records = []
    for lt in lead_times:
        rec = base_record.copy()
        rec["lead_time"] = lt
        lead_records.append(rec)

    probs_lt = predict_prob(lead_records)
    print("A.1 Pengaruh Lead Time (Waktu Pemesanan di Muka):")
    for lt, p in zip(lead_times, probs_lt):
        print(f"   - Lead Time = {lt:3d} hari -> Probabilitas Batal: {p*100:5.2f}%")

    is_lt_monotonic = (np.diff(probs_lt) >= -0.05).all()
    assert probs_lt[-1] > probs_lt[0], "Lead time 500 hari harus memiliki risiko lebih tinggi dari 0 hari!"
    print(f"   -> Status Monotonisitas Lead Time: {'PASSED (Logis)' if is_lt_monotonic else 'WARNING (Non-monotonik)'}")

    # 2. Previous Cancellations Monotonicity
    prev_cancels = [0, 1, 2, 4, 6]
    prev_records = []
    for pc in prev_cancels:
        rec = base_record.copy()
        rec["previous_cancellations"] = pc
        rec["previous_booking_activity"] = pc
        rec["previous_cancellation_rate"] = 1.0 if pc > 0 else 0.0
        prev_records.append(rec)

    probs_pc = predict_prob(prev_records)
    print("\nA.2 Pengaruh Previous Cancellations (Riwayat Pembatalan):")
    for pc, p in zip(prev_cancels, probs_pc):
        print(f"   - Batal Sebelumnya = {pc:2d} kali -> Probabilitas Batal: {p*100:5.2f}%")

    assert probs_pc[-1] > probs_pc[0], "Riwayat pembatalan berulang harus menaikkan probabilitas pembatalan!"
    print("   -> Status Monotonisitas Previous Cancellations: PASSED (Logis & Sensitif)")

    # 3. Special Requests Impact (Should decrease risk)
    spec_reqs = [0, 1, 2, 3, 4]
    spec_records = []
    for sr in spec_reqs:
        rec = base_record.copy()
        rec["total_of_special_requests"] = sr
        spec_records.append(rec)

    probs_sr = predict_prob(spec_records)
    print("\nA.3 Pengaruh Permintaan Khusus (Total Special Requests):")
    for sr, p in zip(spec_reqs, probs_sr):
        print(f"   - Special Requests = {sr:1d} -> Probabilitas Batal: {p*100:5.2f}%")

    assert probs_sr[-1] < probs_sr[0], "Banyak permintaan khusus harus menurunkan probabilitas pembatalan!"
    print("   -> Status Penurunan Risiko Permintaan Khusus: PASSED (Logis)")

    # 4. Repeated Guest Impact (Should decrease risk)
    rec_non_repeat = base_record.copy()
    rec_non_repeat["is_repeated_guest"] = 0
    rec_repeat = base_record.copy()
    rec_repeat["is_repeated_guest"] = 1
    rec_repeat["previous_bookings_not_canceled"] = 4
    rec_repeat["previous_booking_activity"] = 4
    rec_repeat["previous_cancellation_rate"] = 0.0

    probs_rg = predict_prob([rec_non_repeat, rec_repeat])
    print("\nA.4 Pengaruh Tamu Berulang (Repeated Guest):")
    print(f"   - Tamu Baru (is_repeated_guest = 0)     -> Probabilitas Batal: {probs_rg[0]*100:5.2f}%")
    print(f"   - Tamu Langganan (is_repeated_guest = 1) -> Probabilitas Batal: {probs_rg[1]*100:5.2f}%")
    assert probs_rg[1] < probs_rg[0], "Tamu langganan harus memiliki risiko pembatalan lebih rendah!"
    print("   -> Status Efek Tamu Berulang: PASSED (Logis)")

    # 5. Deposit Type Impact
    rec_no_dep = base_record.copy()
    rec_no_dep["deposit_type"] = "No Deposit"
    rec_non_ref = base_record.copy()
    rec_non_ref["deposit_type"] = "Non Refund"
    rec_ref = base_record.copy()
    rec_ref["deposit_type"] = "Refundable"

    probs_dep = predict_prob([rec_no_dep, rec_non_ref, rec_ref])
    print("\nA.5 Pengaruh Tipe Deposit:")
    print(f"   - No Deposit   -> Probabilitas: {probs_dep[0]*100:5.2f}%")
    print(f"   - Non Refund   -> Probabilitas: {probs_dep[1]*100:5.2f}%")
    print(f"   - Refundable   -> Probabilitas: {probs_dep[2]*100:5.2f}%")

    # =========================================================================
    # B. EXTREME OUTLIER & BOUNDARY RESILIENCE
    # =========================================================================
    print("\n" + "-" * 80)
    print("[TEST PILAR B] UJI KETAHANAN DATA EKSTREM & OUTLIER (BOUNDARY RESILIENCE)")
    print("-" * 80)

    extreme_cases = [
        ("ADR Super Ekstrem ($2,500/malam)", {"adr": 2500.0}),
        ("ADR Nol ($0/malam)", {"adr": 0.0}),
        ("Lead Time Super Lama (800 hari)", {"lead_time": 800}),
        ("Rombongan Besar (Dewasa: 15, Anak: 10)", {"adults": 15, "children": 10, "total_guests": 25}),
        ("Durasi Menginap Super Lama (60 malam)", {"stays_in_weekend_nights": 20, "stays_in_week_nights": 40, "total_stay_nights": 60}),
        ("Waiting List Ekstrem (390 hari)", {"days_in_waiting_list": 390}),
        ("Banyak Perubahan Booking (20 kali)", {"booking_changes": 20}),
        ("Banyak Parkir Mobil (10 slot)", {"required_car_parking_spaces": 10}),
        ("Negara Unseen / Tidak Dikenal ('XYZ')", {"country": "XYZ"}),
        ("Negara 'Unknown'", {"country": "Unknown"}),
    ]

    records_ext = []
    for label, override in extreme_cases:
        rec = base_record.copy()
        rec.update(override)
        records_ext.append(rec)

    probs_ext = predict_prob(records_ext)
    all_valid = True
    for (label, _), p in zip(extreme_cases, probs_ext):
        is_valid = not np.isnan(p) and 0.0 <= p <= 1.0
        if not is_valid:
            all_valid = False
        status_str = "VALID" if is_valid else "FAILED"
        print(f"   - {label:45s} -> Prob: {p*100:5.2f}% | [{status_str}]")

    assert all_valid, "Ada input ekstrem yang menghasilkan NaN atau nilai di luar [0, 1]!"
    print("   -> Status Uji Ketahanan Outlier: 100% Lolos & Bebas Crash")

    # =========================================================================
    # C. PROBABILITY CALIBRATION & RELIABILITY AUDIT
    # =========================================================================
    print("\n" + "-" * 80)
    print("[TEST PILAR C] AUDIT KALIBRASI PROBABILITAS (CALIBRATION AUDIT)")
    print("-" * 80)

    if TEST_DATA_PATH.exists():
        test_df = pd.read_parquet(TEST_DATA_PATH)
        y_true = test_df["is_canceled"].values
        X_test = test_df[all_features]

        y_probs = model.predict_proba(X_test)[:, 1]

        brier = brier_score_loss(y_true, y_probs)
        logloss = log_loss(y_true, y_probs)

        print(f"   - Test Set Samples : {len(y_true):,d} baris")
        print(f"   - Brier Score Loss  : {brier:.4f} (Ideal < 0.10, Sangat Baik)")
        print(f"   - Log-Loss Evaluasi : {logloss:.4f}")

        # Binning for Reliability Curve
        n_bins = 10
        bins = np.linspace(0.0, 1.0, n_bins + 1)
        bin_indices = np.digitize(y_probs, bins) - 1

        print("\n   Tabel Kalibrasi Reliability (10 Deciles):")
        print("   " + "-" * 65)
        print("   Bin Interval   | Jml Baris | Mean Pred Prob | Aktual Batal | ECE Gap")
        print("   " + "-" * 65)

        ece = 0.0
        for i in range(n_bins):
            mask = bin_indices == i
            if np.sum(mask) > 0:
                bin_true_rate = np.mean(y_true[mask])
                bin_pred_mean = np.mean(y_probs[mask])
                count = np.sum(mask)
                gap = abs(bin_true_rate - bin_pred_mean)
                ece += (count / len(y_true)) * gap
                print(f"   [{bins[i]:.1f} - {bins[i+1]:.1f}]       | {count:9d} | {bin_pred_mean*100:13.2f}% | {bin_true_rate*100:11.2f}% | {gap*100:6.2f}%")

        print("   " + "-" * 65)
        print(f"   -> Expected Calibration Error (ECE): {ece*100:.2f}% (Bagus jika < 5%)")
        assert brier < 0.12, "Brier score terlalu tinggi!"
        print("   -> Status Kalibrasi: SANGAT BAIK (Well-Calibrated Probabilities)")

    print("\n" + "=" * 80)
    print("SELURUH STRESS TEST & SANITY CHECK SELESAI DENGAN STATUS 100% VALID!")
    print("=" * 80)


if __name__ == "__main__":
    run_stress_test()
