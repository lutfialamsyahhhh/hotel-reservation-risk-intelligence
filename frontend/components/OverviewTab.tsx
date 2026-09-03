"use client";

import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  PieChart as PieIcon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CustomChartTooltip } from "@/components/CustomChartTooltip";

interface OverviewTabProps {
  onNavigateTab: (tab: "overview" | "benchmark" | "single" | "bulk") => void;
}

const CLASS_DISTRIBUTION = [
  { name: "Tidak Dibatalkan (Class 0)", value: 74986, color: "#10b981" },
  { name: "Dibatalkan (Class 1)", value: 44224, color: "#ef4444" },
];

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section (Luxury Gradient) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#171e38] text-white p-8 sm:p-12 shadow-card border border-slate-800/80">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 dark:bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 border border-white/10 dark:border-blue-500/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>SDG 8 MVP · Hotel Industry AI Risk Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            AI-Powered Hotel Reservation Risk Intelligence.
          </h1>

          <p className="text-slate-300 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Platform analitik prediktif berbasis CatBoost Classifier untuk mengidentifikasi potensi pembatalan
            reservasi sedini mungkin, melindungi stabilitas pendapatan kamar, dan menjaga kesejahteraan staf operasional hotel.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab("single")}
              className="inline-flex items-center gap-2 btn-primary text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              <span>Uji Prediksi Satuan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigateTab("bulk")}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all border border-white/20 dark:border-slate-700 backdrop-blur-md active:scale-95"
            >
              <span>Unggah Batch CSV</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/20 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
      </section>

      {/* 4 Premium KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="enterprise-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Dataset Latih
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">119.210</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zero-Leakage Cleaned (83.447 Train)</p>
        </div>

        <div className="enterprise-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Model Champion
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            CatBoost GPU
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Native Binary (.cbm · 3.87 MB)</p>
        </div>

        <div className="enterprise-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Optimal Threshold
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">0.54</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">F1-Score 83.27% · Recall 85.04%</p>
        </div>

        <div className="enterprise-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Baseline Cancel Rate
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">37.08%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">44.224 Batal vs 74.986 Aman</p>
        </div>
      </section>

      {/* Analytics & Architecture Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Distribution Donut Chart (5 cols) */}
        <div className="lg:col-span-5 enterprise-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Proporsi Pembatalan Historis</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribusi kelas target pada 119.210 baris dataset perhotelan setelah pembersihan anomali.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CLASS_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CLASS_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <CustomChartTooltip
                      valueFormatter={(v) => `${v.toLocaleString()} reservasi`}
                    />
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex justify-between font-mono font-semibold">
            <span>Class 0: 62.92%</span>
            <span>Class 1: 37.08%</span>
          </div>
        </div>

        {/* SDG 8 & Architecture Governance Panel (7 cols) */}
        <div className="lg:col-span-7 enterprise-card space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tata Kelola Pipeline & Dampak SDG 8</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Arsitektur prediktif dibangun dengan standar keamanan *zero-leakage* dan etika data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                <Lock className="h-4 w-4" />
                <span>Strict Zero-Leakage</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                8 kolom status pasca-kejadian (`reservation_status`, `name`, `email`, dll) telah dieliminasi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Zap className="h-4 w-4" />
                <span>Thread-Safe Ingestion</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pencatatan riwayat prediksi diamankan dengan `asyncio.Lock()` per event loop mencegah race condition.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5 sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kontribusi Nyata terhadap SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mencegah *overbooking* kacau dan mengurangi beban stres staf *front desk*, sekaligus memungkinkan hotel menerapkan kebijakan deposit terarah untuk melindungi pendapatan tahunan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
