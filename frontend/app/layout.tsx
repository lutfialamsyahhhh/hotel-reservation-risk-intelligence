import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prediksi Risiko Pembatalan Reservasi Hotel | SDG 8 AI Platform",
  description:
    "Platform Analitik Prediktif Risiko Pembatalan Reservasi Hotel Berbasis AI CatBoost untuk Mendukung SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi) oleh Muhammad Lutfi Alamsyah & Maudy Amalia (Artificial Intelligence Intern).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
