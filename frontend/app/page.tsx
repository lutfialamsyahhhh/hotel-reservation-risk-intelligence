"use client";

import React, { useEffect, useState } from "react";
import { BenchmarkTab } from "@/components/BenchmarkTab";
import { BulkPredictionTab } from "@/components/BulkPredictionTab";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { OverviewTab } from "@/components/OverviewTab";
import { SinglePredictionTab } from "@/components/SinglePredictionTab";
import { getHealth } from "@/lib/api";
import { HealthStatusResponse } from "@/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "benchmark" | "single" | "bulk">(
    "overview"
  );
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("hotelrisk_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("hotelrisk_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await getHealth();
      setHealth(res);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sticky Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-8 pb-12">
        {activeTab === "overview" && <OverviewTab onNavigateTab={setActiveTab} />}
        {activeTab === "benchmark" && <BenchmarkTab />}
        {activeTab === "single" && <SinglePredictionTab />}
        {activeTab === "bulk" && <BulkPredictionTab />}
      </main>

      {/* Professional Multi-Column Enterprise Footer */}
      <Footer />
    </div>
  );
}
