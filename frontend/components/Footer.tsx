"use client";

import React from "react";
import {
  Building2,
  Cpu,
  Globe2,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b101d] transition-colors duration-200 mt-auto">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand & Mission Statement (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                    HotelRisk<span className="text-blue-500 dark:text-blue-400">AI</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    SDG 8 MVP
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Intelijen Prediktif Mitigasi Risiko Pembatalan
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              Platform analitik prediktif berbasis CatBoost Classifier untuk mengantisipasi risiko pembatalan
              reservasi hotel sedini mungkin, melindungi kestabilan pendapatan kamar, dan menjaga kesejahteraan staf operasional hotel.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800/60">
                <Globe2 className="h-3 w-3" />
                <span>SDG 8: Decent Work & Economic Growth</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800/60">
                <Cpu className="h-3 w-3" />
                <span>CatBoost Native GPU (.cbm)</span>
              </span>
            </div>
          </div>

          {/* Column 2: Core Engineering Pillars (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Pilar Rekayasa AI</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>Strict Zero-Leakage Pipeline</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>Optimal Decision Cutoff (0.54)</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>Thread-Safe Async Logging</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>119.210 Cleaned Data Records</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer & Internship Credits Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Tim Pengembang AI
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  AI Intern
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>Muhammad Lutfi Alamsyah</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>Maudy Amalia</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">PT Vinix Seven Aurum</span>
                <span>Internship 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#070b14] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-500 dark:text-slate-400">
          <p>
            Hak Cipta © 2026 <strong>PT Vinix Seven Aurum</strong>. Seluruh Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            <span>FastAPI Monorepo</span>
            <span>·</span>
            <span>Next.js 14 App Router</span>
            <span>·</span>
            <span>CatBoost Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
