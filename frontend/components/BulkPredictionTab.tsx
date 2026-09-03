"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  UploadCloud,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CustomChartTooltip } from "@/components/CustomChartTooltip";
import { predictBulk } from "@/lib/api";
import { BulkPredictionResponse } from "@/types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROW_LIMIT = 10000;

export const BulkPredictionTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<BulkPredictionResponse | null>(null);

  // Table filter, search & pagination state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = async (file: File) => {
    setError(null);
    setResponse(null);

    // 1. Extension Guardrail
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Format file tidak valid. Harap unggah file berekstensi .csv.");
      return;
    }

    // 2. Size Guardrail (5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `Ukuran file (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal 5 MB.`
      );
      return;
    }

    // 3. Row Count Guardrail Pre-check
    try {
      const text = await file.text();
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      const dataRowCount = Math.max(0, lines.length - 1);

      if (dataRowCount === 0) {
        setError("File CSV kosong atau tidak memiliki baris data.");
        return;
      }

      if (dataRowCount > MAX_ROW_LIMIT) {
        setError(
          `Jumlah data (${dataRowCount.toLocaleString()} baris) melebihi batas maksimal 10.000 baris per batch.`
        );
        return;
      }

      setSelectedFile(file);
    } catch {
      setError("Gagal membaca struktur file CSV. Pastikan format teks UTF-8 valid.");
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      const res = await predictBulk(selectedFile);
      setResponse(res);
      setCurrentPage(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memproses analisis batch reservasi.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = async () => {
    try {
      const res = await fetch("/template_hotel_bookings_batch.csv");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "template_hotel_bookings_batch.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback
    }

    const fallbackUrl = "/template_hotel_bookings_batch.csv";
    const link = document.createElement("a");
    link.href = fallbackUrl;
    link.setAttribute("download", "template_hotel_bookings_batch.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportResultsToCsv = () => {
    if (!response) return;
    const header = "row_id,hotel,lead_time,adr,customer_type,probability,risk_label,is_canceled\n";
    const rows = response.results
      .map(
        (r) =>
          `${r.row_id},"${r.key_summary.hotel}",${r.key_summary.lead_time},${r.key_summary.adr},"${r.key_summary.customer_type}",${r.probability},"${r.risk_label}",${r.is_canceled_prediction}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hasil_prediksi_pembatalan_hotel_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows =
    response?.results.filter((r) => {
      const matchesRisk =
        riskFilter === "ALL" ? true : r.risk_label.toUpperCase() === riskFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === ""
          ? true
          : r.key_summary.hotel.toLowerCase().includes(q) ||
          r.key_summary.customer_type.toLowerCase().includes(q) ||
          r.row_id.toString().includes(q);

      return matchesRisk && matchesSearch;
    }) || [];

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pieChartData = response
    ? [
      { name: "Risiko Rendah", value: response.risk_distribution.low_count, color: "#10b981" },
      { name: "Risiko Sedang", value: response.risk_distribution.medium_count, color: "#f59e0b" },
      { name: "Risiko Tinggi", value: response.risk_distribution.high_count, color: "#ef4444" },
    ]
    : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Sample Download */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Analitik Batch CSV (Bulk Predictor)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unggah file CSV untuk memproses ribuan reservasi sekaligus dengan batas guardrail 5 MB & 10.000 baris.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3 self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Unduh Template CSV Sampel</span>
        </button>
      </div>

      {/* Upload Dropzone Card */}
      <div className="enterprise-card space-y-5">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="h-14 w-14 rounded-2xl bg-blue-100/80 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-xs border border-blue-200/50 dark:border-blue-800/50">
            <UploadCloud className="h-7 w-7" />
          </div>

          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedFile ? selectedFile.name : "Tarik & Lepas File CSV ke Sini"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            atau klik untuk memilih file dari komputer Anda
          </p>

          <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            <span>Batas Maks: 5.0 MB</span>
            <span>·</span>
            <span>Maks: 10.000 Baris Data</span>
            <span>·</span>
            <span>Format: .csv</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold">Batas Guardrail Terlampaui:</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Selected File Action Bar */}
        {selectedFile && !error && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">{selectedFile.name}</span>
              <span className="text-xs text-slate-400">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            <button
              onClick={handleProcessUpload}
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menganalisis Probabilitas Batch...</span>
                </>
              ) : (
                <>
                  <span>Mulai Prediksi Batch</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results Section */}
      {response && (
        <div className="space-y-8">
          {/* Summary Metrics & Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Aggregate Stats & Metric Pills (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="enterprise-card space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Ringkasan Eksekusi Batch
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Terproses</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {response.total_rows_processed.toLocaleString()} baris
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Latensi Inferensi</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {response.execution_time_ms} ms
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80">
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                    Prediksi Cancellation Rate Batch
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {(response.risk_distribution.cancellation_rate_predicted * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Berdasarkan ambang batas optimal (cutoff 0.54)
                  </p>
                </div>

                {/* Risk Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="block font-medium text-[11px]">Risiko Rendah</span>
                    <span className="font-mono font-bold text-base">
                      {response.risk_distribution.low_count}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                    <span className="block font-medium text-[11px]">Risiko Sedang</span>
                    <span className="font-mono font-bold text-base">
                      {response.risk_distribution.medium_count}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
                    <span className="block font-medium text-[11px]">Risiko Tinggi</span>
                    <span className="font-mono font-bold text-base">
                      {response.risk_distribution.high_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut Chart (7 cols) */}
            <div className="lg:col-span-7 enterprise-card flex flex-col justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Distribusi Kategori Risiko Batch
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <CustomChartTooltip
                          valueFormatter={(val) => `${val.toLocaleString()} reservasi`}
                        />
                      }
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Data Table Card */}
          <div className="enterprise-card space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tabel Hasil Prediksi per Baris
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredRows.length} dari {response.total_rows_processed} baris terproses
                </p>
              </div>

              {/* Controls: Search, Filter, Page Size & Export */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Instant Search */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari hotel / tipe tamu..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="enterprise-input pl-9 pr-3 py-1.5 h-9 text-xs w-48"
                  />
                </div>

                {/* Risk Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={riskFilter}
                    onChange={(e) => {
                      setRiskFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="enterprise-input py-1.5 px-3 h-9 text-xs w-40"
                  >
                    <option value="ALL">Semua Tingkat Risiko</option>
                    <option value="RENDAH">Risiko Rendah</option>
                    <option value="SEDANG">Risiko Sedang</option>
                    <option value="TINGGI">Risiko Tinggi</option>
                  </select>
                </div>

                {/* Rows Per Page */}
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="enterprise-input py-1.5 px-2 h-9 text-xs w-28"
                >
                  <option value={10}>10 baris / hal</option>
                  <option value={25}>25 baris / hal</option>
                  <option value={50}>50 baris / hal</option>
                </select>

                {/* Export Button */}
                <button
                  onClick={exportResultsToCsv}
                  className="btn-primary text-xs py-1.5 px-3.5 h-9 inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Ekspor Hasil (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/60">
                    <th className="py-3 px-3"># Baris</th>
                    <th className="py-3 px-3">Tipe Hotel</th>
                    <th className="py-3 px-3">Lead Time</th>
                    <th className="py-3 px-3">ADR ($)</th>
                    <th className="py-3 px-3">Tipe Pelanggan</th>
                    <th className="py-3 px-3">Probabilitas</th>
                    <th className="py-3 px-3">Kategori Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        Tidak ada baris data yang cocok dengan kriteria pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.row_id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-xs">{row.row_id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.key_summary.hotel}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {row.key_summary.lead_time} hari
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          ${row.key_summary.adr.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                          {row.key_summary.customer_type}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {(row.probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${row.risk_label === "Rendah"
                                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                : row.risk_label === "Sedang"
                                  ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                  : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                              }`}
                          >
                            {row.risk_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
