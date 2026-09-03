"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Grid,
  LineChart as LineIcon,
  RefreshCw,
  Sliders,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CustomChartTooltip } from "@/components/CustomChartTooltip";
import { getBenchmark } from "@/lib/api";
import { BenchmarkResponse } from "@/types";

const FEATURE_IMPORTANCE_DATA = [
  { name: "lead_time", importance: 21.4 },
  { name: "country", importance: 18.2 },
  { name: "deposit_type", importance: 12.8 },
  { name: "market_segment", importance: 8.7 },
  { name: "previous_cancellation_rate", importance: 7.9 },
  { name: "adr", importance: 6.5 },
  { name: "total_of_special_requests", importance: 5.4 },
  { name: "arrival_week_number", importance: 4.3 },
  { name: "customer_type", importance: 3.8 },
  { name: "total_stay_nights", importance: 3.1 },
  { name: "required_car_parking_spaces", importance: 2.7 },
  { name: "assigned_room_type", importance: 2.1 },
];

export const BenchmarkTab: React.FC = () => {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarkData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBenchmark();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat hasil benchmark.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Memuat laporan komparasi model...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="enterprise-card text-center py-12 space-y-4">
        <p className="text-rose-600 dark:text-rose-400 font-semibold text-sm">
          {error || "Data benchmark tidak ditemukan."}
        </p>
        <button onClick={fetchBenchmarkData} className="btn-primary">
          Coba Muat Ulang
        </button>
      </div>
    );
  }

  const comparisonData = [
    {
      metric: "F1-Score",
      "Logistic Regression": 0.7526,
      "Random Forest": 0.8057,
      CatBoost: 0.8327,
    },
    {
      metric: "Recall (Cancel)",
      "Logistic Regression": 0.781,
      "Random Forest": 0.8032,
      CatBoost: 0.8504,
    },
    {
      metric: "Precision",
      "Logistic Regression": 0.7261,
      "Random Forest": 0.8082,
      CatBoost: 0.8158,
    },
    {
      metric: "ROC-AUC",
      "Logistic Regression": 0.8957,
      "Random Forest": 0.9333,
      CatBoost: 0.947,
    },
    {
      metric: "PR-AUC",
      "Logistic Regression": 0.8587,
      "Random Forest": 0.907,
      CatBoost: 0.9242,
    },
  ];

  const cm = {
    tn: 10011,
    fp: 1237,
    fn: 1048,
    tp: 5586,
    total: 17882,
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 mb-2">
            <Award className="h-3.5 w-3.5" />
            <span>Champion Model: CatBoost Classifier (.cbm)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Benchmarking 3 Filosofi Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi komparatif antara Linear Baseline, Bagging Ensemble, dan Boosting.
          </p>
        </div>

        <button
          onClick={fetchBenchmarkData}
          className="btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Model Matrix Table Card */}
      <div className="enterprise-card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Matriks Performa Validasi (17.881 Baris)
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Held-out split: 15%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/60">
                <th className="py-3 px-4">Model & Filosofi</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">Recall (Cancel)</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">PR-AUC</th>
                <th className="py-3 px-4">Waktu Latih</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Logistic Regression <span className="text-xs text-slate-400 block">Linear Baseline</span>
                </td>
                <td className="py-3.5 px-4">75.26%</td>
                <td className="py-3.5 px-4">78.10%</td>
                <td className="py-3.5 px-4">72.61%</td>
                <td className="py-3.5 px-4">0.8957</td>
                <td className="py-3.5 px-4">0.8587</td>
                <td className="py-3.5 px-4">2.43s</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                    Baseline
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Random Forest <span className="text-xs text-slate-400 block">Bagging Ensemble</span>
                </td>
                <td className="py-3.5 px-4">80.57%</td>
                <td className="py-3.5 px-4">80.32%</td>
                <td className="py-3.5 px-4">80.82%</td>
                <td className="py-3.5 px-4">0.9333</td>
                <td className="py-3.5 px-4">0.9070</td>
                <td className="py-3.5 px-4">3.63s</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                    Challenger
                  </span>
                </td>
              </tr>

              <tr className="bg-blue-50/40 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500 font-semibold text-slate-900 dark:text-white">
                <td className="py-3.5 px-4 font-sans text-blue-900 dark:text-blue-300">
                  CatBoost (Optimal 0.54)
                  <span className="text-xs text-blue-600 dark:text-blue-400 block font-normal">
                    Boosting Champion
                  </span>
                </td>
                <td className="py-3.5 px-4 text-blue-700 dark:text-blue-400 font-bold">83.27%</td>
                <td className="py-3.5 px-4 text-blue-700 dark:text-blue-400 font-bold">85.04%</td>
                <td className="py-3.5 px-4 text-blue-700 dark:text-blue-400 font-bold">81.58%</td>
                <td className="py-3.5 px-4 text-blue-700 dark:text-blue-400 font-bold">0.9470</td>
                <td className="py-3.5 px-4 text-blue-700 dark:text-blue-400 font-bold">0.9242</td>
                <td className="py-3.5 px-4">24.94s</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Champion
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Comparison Bar Chart + Threshold Scan Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Bar Chart */}
        <div className="enterprise-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Perbandingan Metrik Utama
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis domain={[0.6, 1.0]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="Logistic Regression" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Random Forest" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CatBoost" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threshold Scan Line Chart */}
        <div className="enterprise-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Threshold Scanning Curve [0.10 - 0.90]
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.threshold_scan_results}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="threshold"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <YAxis domain={[0.4, 1.0]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <ReferenceLine
                  x={0.54}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: "Cutoff 0.54",
                    fill: "#ef4444",
                    fontSize: 11,
                    position: "top",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="f1_score"
                  name="F1-Score"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="recall"
                  name="Recall"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="precision"
                  name="Precision"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Confusion Matrix on Test Set + Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 enterprise-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Grid className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Confusion Matrix (Test Set: 17.882 Baris)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                True Negative (TN)
              </span>
              <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono mt-1 block">
                {cm.tn.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Aman & Diprediksi Aman
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-center">
              <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                False Positive (FP)
              </span>
              <span className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 font-mono mt-1 block">
                {cm.fp.toLocaleString()}
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                Aman tapi Diprediksi Batal
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-center">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                False Negative (FN)
              </span>
              <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 font-mono mt-1 block">
                {cm.fn.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Batal tapi Diprediksi Aman
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-center">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                True Positive (TP)
              </span>
              <span className="text-2xl font-extrabold text-blue-900 dark:text-blue-200 font-mono mt-1 block">
                {cm.tp.toLocaleString()}
              </span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                Batal & Sukses Terdeteksi
              </span>
            </div>
          </div>
        </div>

        {/* Feature Importance (7 cols) */}
        <div className="lg:col-span-7 enterprise-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top 12 Feature Importance (CatBoost)
            </h3>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={FEATURE_IMPORTANCE_DATA}
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  width={90}
                />
                <Tooltip content={<CustomChartTooltip unit="%" />} />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {FEATURE_IMPORTANCE_DATA.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#2563eb" : index < 3 ? "#3b82f6" : "#60a5fa"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
