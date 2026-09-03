"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { predictSingle } from "@/lib/api";
import { PredictionResponse, SingleBookingPayload } from "@/types";

interface CasePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  iconColor: string;
  payload: SingleBookingPayload;
}

const CASE_PRESETS: CasePreset[] = [
  {
    id: "case_direct_resort",
    name: "Pemesanan Langsung Resort (Lead Time Singkat)",
    badge: "🟢 Kasus 1",
    description:
      "Tamu memesan langsung (Direct) ke Resort Hotel untuk liburan dengan lead time singkat (15 hari) dan 1 permintaan preferensi kamar.",
    iconColor: "emerald",
    payload: {
      hotel: "Resort Hotel",
      lead_time: 15,
      arrival_date_year: 2017,
      arrival_date_month: "July",
      arrival_date_week_number: 28,
      arrival_date_day_of_month: 15,
      stays_in_weekend_nights: 1,
      stays_in_week_nights: 3,
      adults: 2,
      children: 0,
      babies: 0,
      meal: "BB",
      country: "GBR",
      market_segment: "Direct",
      distribution_channel: "Direct",
      is_repeated_guest: 0,
      previous_cancellations: 0,
      previous_bookings_not_canceled: 0,
      reserved_room_type: "A",
      assigned_room_type: "A",
      booking_changes: 0,
      deposit_type: "No Deposit",
      days_in_waiting_list: 0,
      customer_type: "Transient",
      adr: 140.0,
      required_car_parking_spaces: 0,
      total_of_special_requests: 1,
    },
  },
  {
    id: "case_regular_ota",
    name: "Wisatawan Reguler OTA (Lead Time 1 Bulan)",
    badge: "🟡 Kasus 2",
    description:
      "Wisatawan memesan City Hotel melalui Online Travel Agent (OTA) 35 hari sebelum jadwal menginap tanpa deposit, dengan 1 permintaan khusus.",
    iconColor: "amber",
    payload: {
      hotel: "City Hotel",
      lead_time: 35,
      arrival_date_year: 2017,
      arrival_date_month: "August",
      arrival_date_week_number: 33,
      arrival_date_day_of_month: 14,
      stays_in_weekend_nights: 1,
      stays_in_week_nights: 2,
      adults: 2,
      children: 0,
      babies: 0,
      meal: "BB",
      country: "GBR",
      market_segment: "Online TA",
      distribution_channel: "TA/TO",
      is_repeated_guest: 0,
      previous_cancellations: 0,
      previous_bookings_not_canceled: 0,
      reserved_room_type: "A",
      assigned_room_type: "A",
      booking_changes: 0,
      deposit_type: "No Deposit",
      days_in_waiting_list: 0,
      customer_type: "Transient",
      adr: 120.0,
      required_car_parking_spaces: 0,
      total_of_special_requests: 1,
    },
  },
  {
    id: "case_early_ota_city",
    name: "Pemesanan Dini OTA (Lead Time 5 Bulan)",
    badge: "🔴 Kasus 3",
    description:
      "Pemesanan City Hotel via Online Travel Agent yang dibuat 150 hari (5 bulan) di muka tanpa deposit dan tanpa permintaan khusus.",
    iconColor: "rose",
    payload: {
      hotel: "City Hotel",
      lead_time: 150,
      arrival_date_year: 2017,
      arrival_date_month: "September",
      arrival_date_week_number: 37,
      arrival_date_day_of_month: 10,
      stays_in_weekend_nights: 1,
      stays_in_week_nights: 3,
      adults: 2,
      children: 0,
      babies: 0,
      meal: "BB",
      country: "PRT",
      market_segment: "Online TA",
      distribution_channel: "TA/TO",
      is_repeated_guest: 0,
      previous_cancellations: 0,
      previous_bookings_not_canceled: 0,
      reserved_room_type: "A",
      assigned_room_type: "A",
      booking_changes: 0,
      deposit_type: "No Deposit",
      days_in_waiting_list: 0,
      customer_type: "Transient",
      adr: 110.0,
      required_car_parking_spaces: 0,
      total_of_special_requests: 0,
    },
  },
];

export const SinglePredictionTab: React.FC = () => {
  const [formData, setFormData] = useState<SingleBookingPayload>(
    CASE_PRESETS[1].payload
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_regular_ota");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
    setSelectedCaseId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await predictSingle(formData);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses inferensi risiko.");
    } finally {
      setLoading(false);
    }
  };

  const applyCasePreset = (preset: CasePreset) => {
    setFormData(preset.payload);
    setSelectedCaseId(preset.id);
    setResult(null);
    setError(null);
  };

  // SVG Radial Gauge parameters
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const probPercent = result ? Math.min(Math.max(result.probability * 100, 0), 100) : 0;
  const strokeDashoffset = circumference - (probPercent / 100) * circumference;

  const currentCase = CASE_PRESETS.find((c) => c.id === selectedCaseId);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Realistic Case Selector */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Prediksi Risiko Reservasi Satuan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulasikan skenario reservasi nyata di perhotelan untuk menguji model CatBoost secara objektif.
          </p>
        </div>

        {/* Real-World Case Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Pilih Skenario Nyata Industri:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CASE_PRESETS.map((preset) => {
              const isSelected = selectedCaseId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyCasePreset(preset)}
                  className={`p-3 rounded-xl text-left border transition-all duration-150 active:scale-98 ${isSelected
                      ? preset.id === "case_direct_resort"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-700 shadow-xs"
                        : preset.id === "case_regular_ota"
                          ? "bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 shadow-xs"
                          : "bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-700 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {preset.badge}
                    </span>
                    <span
                      className={`text-xs font-bold ${isSelected
                          ? preset.id === "case_direct_resort"
                            ? "text-emerald-800 dark:text-emerald-200"
                            : preset.id === "case_regular_ota"
                              ? "text-amber-800 dark:text-amber-200"
                              : "text-rose-800 dark:text-rose-200"
                          : "text-slate-800 dark:text-slate-200"
                        }`}
                    >
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Case Context Banner */}
        {currentCase && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-200">
                Konteks Kasus: {currentCase.name}
              </span>
              <p className="mt-0.5 leading-relaxed">{currentCase.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left (7 cols) + Result Panel Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* Sektor 1: Tipe Hotel & Periode Kedatangan */}
          <div className="enterprise-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>1. Tipe Hotel & Waktu Kedatangan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Hotel
                </label>
                <select
                  name="hotel"
                  value={formData.hotel}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="City Hotel">City Hotel (Hotel Kota)</option>
                  <option value="Resort Hotel">Resort Hotel (Hotel Resor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Waktu Pemesanan di Muka (Lead Time)
                </label>
                <input
                  type="number"
                  name="lead_time"
                  min="0"
                  placeholder="Contoh: 35 (hari)"
                  value={formData.lead_time}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bulan Kedatangan
                </label>
                <select
                  name="arrival_date_month"
                  value={formData.arrival_date_month}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    name="arrival_date_year"
                    value={formData.arrival_date_year}
                    onChange={handleInputChange}
                    className="enterprise-input font-mono px-2 text-center"
                    min="2015"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Minggu
                  </label>
                  <input
                    type="number"
                    name="arrival_date_week_number"
                    value={formData.arrival_date_week_number}
                    onChange={handleInputChange}
                    className="enterprise-input font-mono px-2 text-center"
                    min="1"
                    max="53"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="number"
                    name="arrival_date_day_of_month"
                    value={formData.arrival_date_day_of_month}
                    onChange={handleInputChange}
                    className="enterprise-input font-mono px-2 text-center"
                    min="1"
                    max="31"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Malam Akhir Pekan (Weekend Nights)
                </label>
                <input
                  type="number"
                  name="stays_in_weekend_nights"
                  min="0"
                  placeholder="Jumlah malam Sabtu/Minggu"
                  value={formData.stays_in_weekend_nights}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Malam Hari Kerja (Week Nights)
                </label>
                <input
                  type="number"
                  name="stays_in_week_nights"
                  min="0"
                  placeholder="Jumlah malam Senin-Jumat"
                  value={formData.stays_in_week_nights}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sektor 2: Komposisi Tamu & Profil Pelanggan */}
          <div className="enterprise-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Komposisi Tamu & Profil Pelanggan</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Dewasa (Adults)
                </label>
                <input
                  type="number"
                  name="adults"
                  min="0"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Anak (Children)
                </label>
                <input
                  type="number"
                  name="children"
                  min="0"
                  value={formData.children}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Bayi (Babies)
                </label>
                <input
                  type="number"
                  name="babies"
                  min="0"
                  value={formData.babies}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Pelanggan (Customer Type)
                </label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="Transient">Transient (Individu Reguler)</option>
                  <option value="Transient-Party">Transient-Party (Rombongan)</option>
                  <option value="Contract">Contract (Kerjasama Kontrak)</option>
                  <option value="Group">Group (Kelompok Wisata)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Tamu Berulang
                </label>
                <select
                  name="is_repeated_guest"
                  value={formData.is_repeated_guest}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value={0}>0 = Tamu Baru</option>
                  <option value={1}>1 = Tamu Langganan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paket Makanan (Meal Plan)
                </label>
                <select
                  name="meal"
                  value={formData.meal}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="BB">Bed & Breakfast (BB)</option>
                  <option value="HB">Half Board (HB)</option>
                  <option value="FB">Full Board (FB)</option>
                  <option value="SC">Self Catering (SC)</option>
                  <option value="Undefined">Undefined (Tanpa Paket)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sektor 3: Finansial, Saluran & Kamar */}
          <div className="enterprise-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>3. Finansial, Distribusi & Alokasi Kamar</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Harian Rata-Rata (ADR $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="adr"
                  placeholder="Contoh: 120.0 (skala $/malam)"
                  value={formData.adr}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Negara Asal (ISO-3)
                </label>
                <input
                  type="text"
                  name="country"
                  maxLength={3}
                  placeholder="Kode 3 huruf ISO, contoh: PRT, IDN, GBR"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="enterprise-input uppercase font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Segmen Pasar (Market Segment)
                </label>
                <select
                  name="market_segment"
                  value={formData.market_segment}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="Online TA">Online TA (Traveloka, Booking.com, dll)</option>
                  <option value="Offline TA/TO">Offline TA/TO (Agen Travel Konvensional)</option>
                  <option value="Direct">Direct (Pemesanan Langsung)</option>
                  <option value="Corporate">Corporate (Korporat / Bisnis)</option>
                  <option value="Groups">Groups (Rombongan)</option>
                  <option value="Complementary">Complementary (Komplementer)</option>
                  <option value="Aviation">Aviation (Kru Maskapai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Saluran Distribusi (Distribution Channel)
                </label>
                <select
                  name="distribution_channel"
                  value={formData.distribution_channel}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="TA/TO">TA/TO (Travel Agent / Tour Operator)</option>
                  <option value="Direct">Direct (Pemesanan Langsung)</option>
                  <option value="Corporate">Corporate (Perusahaan)</option>
                  <option value="GDS">GDS (Global Distribution System)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Deposit Jaminan (Deposit Type)
                </label>
                <select
                  name="deposit_type"
                  value={formData.deposit_type}
                  onChange={handleInputChange}
                  className="enterprise-input"
                >
                  <option value="No Deposit">No Deposit (Tanpa Uang Muka)</option>
                  <option value="Non Refund">Non Refund (Tidak Dapat Dikembalikan)</option>
                  <option value="Refundable">Refundable (Dapat Dikembalikan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Permintaan Khusus (Special Requests)
                </label>
                <input
                  type="number"
                  min="0"
                  name="total_of_special_requests"
                  placeholder="Contoh: 1 (lantai tinggi, non-smoking, dll)"
                  value={formData.total_of_special_requests}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Kamar yang Dipesan (Reserved Room)
                </label>
                <select
                  name="reserved_room_type"
                  value={formData.reserved_room_type}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H", "L"].map((r) => (
                    <option key={r} value={r}>
                      Tipe Kamar {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Kamar yang Ditugaskan (Assigned Room)
                </label>
                <select
                  name="assigned_room_type"
                  value={formData.assigned_room_type}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L"].map((r) => (
                    <option key={r} value={r}>
                      Tipe Kamar {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sektor 4: Riwayat Reservasi & Interaksi */}
          <div className="enterprise-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>4. Riwayat Reservasi & Perubahan Data</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batal Sebelumnya
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  name="previous_cancellations"
                  value={formData.previous_cancellations}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reservasi Sukses
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  name="previous_bookings_not_canceled"
                  value={formData.previous_bookings_not_canceled}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perubahan Booking
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  name="booking_changes"
                  value={formData.booking_changes}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parkir Mobil
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  name="required_car_parking_spaces"
                  value={formData.required_car_parking_spaces}
                  onChange={handleInputChange}
                  className="enterprise-input font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Submit CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base font-semibold shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Menganalisis Probabilitas Risiko...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Hitung Risiko Pembatalan</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Prediction Outcome & Gauge Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="enterprise-card sticky top-24 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hasil Penilaian Risiko
              </h3>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                CatBoost Engine
              </span>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                <p className="font-bold">Galat Inferensi:</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="py-16 text-center space-y-3">
                <HelpCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Silakan isi formulir karakteristik pemesanan atau pilih salah satu skenario kasus nyata di atas untuk menjalankan simulasi.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Risk Badge Capsule */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status Risiko:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border shadow-xs ${result.risk_label === "Rendah"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-glow-emerald"
                        : result.risk_label === "Sedang"
                          ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-glow-rose"
                      }`}
                  >
                    {result.risk_label === "Rendah" && <CheckCircle2 className="h-4 w-4" />}
                    {result.risk_label === "Sedang" && <AlertTriangle className="h-4 w-4" />}
                    {result.risk_label === "Tinggi" && <ShieldAlert className="h-4 w-4" />}
                    <span>Risiko {result.risk_label}</span>
                  </span>
                </div>

                {/* Circular / Radial Probability Ring Meter */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-44 w-44 transform -rotate-90">
                      {/* Background Track */}
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        stroke="#1e293b"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      {/* Active Animated Gauge */}
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        stroke={
                          result.probability < 0.35
                            ? "#10b981"
                            : result.probability < 0.54
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {(result.probability * 100).toFixed(1)}%
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Probabilitas Batal
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                    Ambang Batas Keputusan (Cutoff): {(result.threshold_used * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Actionable Operational Recommendations based on Blueprint */}
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-1.5">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>Rekomendasi Aksi Staf Hotel</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.risk_label === "Rendah" &&
                      "Konfirmasi reservasi standar, tidak memerlukan tindakan khusus. Tamu memiliki komitmen kedatangan tinggi; prioritaskan pemenuhan preferensi kamar."}
                    {result.risk_label === "Sedang" &&
                      "Kirimkan email pengingat kedatangan atau tawarkan layanan add-on/fasilitas ekstra 3 hari sebelum jadwal check-in untuk memperkuat komitmen tamu."}
                    {result.risk_label === "Tinggi" &&
                      "Prioritaskan konfirmasi ulang deposit/kartu jaminan dan persiapkan strategi overbooking terukur guna meminimalkan potensi kerugian kamar kosong."}
                  </p>
                </div>

                {/* Audit Request ID Metadata */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between font-mono">
                  <span>ID Sesi: {result.request_id}</span>
                  <span>Model: {result.model_name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
