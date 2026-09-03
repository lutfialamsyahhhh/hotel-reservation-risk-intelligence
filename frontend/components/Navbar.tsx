"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Layers,
  Moon,
  Sun,
} from "lucide-react";
import { HealthStatusResponse } from "@/types";

interface NavbarProps {
  activeTab: "overview" | "benchmark" | "single" | "bulk";
  setActiveTab: (tab: "overview" | "benchmark" | "single" | "bulk") => void;
  health: HealthStatusResponse | null;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  theme,
  toggleTheme,
}) => {
  const isOnline = health?.status === "healthy" && health?.model_loaded;

  const navItems = [
    { id: "overview", label: "Ringkasan Eksekutif", icon: Layers },
    { id: "benchmark", label: "Tolok Ukur Model", icon: BarChart3 },
    { id: "single", label: "Prediksi Satuan", icon: Activity },
    { id: "bulk", label: "Analitik Batch CSV", icon: FileSpreadsheet },
  ] as const;

  return (
    <header className="w-full sticky top-0 z-50 select-none shadow-xs transition-colors duration-200">
      {/* Top Banner: SDG 8 & Live API Health */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 text-xs px-4 sm:px-8 py-2 flex items-center justify-between border-b border-slate-800 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SDG 8 · Pekerjaan Layak & Pertumbuhan Ekonomi
          </span>
          <span className="hidden md:inline text-slate-400 dark:text-slate-500">
            Platform AI Mitigasi Risiko Pembatalan Reservasi & Proteksi Pendapatan Hotel
          </span>
        </div>

        {/* Live Backend Connection Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${isOnline
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/60 border-rose-500/30 text-rose-300"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOnline
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
                  : "bg-rose-500"
                }`}
            />
            <span>{isOnline ? "FastAPI Online · CatBoost Aktif" : "Backend Offline"}</span>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Navigation Bar */}
      <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                HotelRisk<span className="text-blue-500 dark:text-blue-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                SDG 8 MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelijen Prediktif Mitigasi Risiko Pembatalan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Interactive Tab Switcher */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/60 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 ${isActive
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                      }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle Button (Light / Dark Mode Switcher) */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 shadow-xs flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
