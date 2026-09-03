"use client";

import React from "react";

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  unit?: string;
  payload?: Record<string, unknown>;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  valueFormatter?: (val: number) => string;
  unit?: string;
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
  unit,
}) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50 pointer-events-none min-w-[140px]">
        {label !== undefined && label !== null && label !== "" && (
          <div className="font-semibold text-slate-300 border-b border-slate-700/60 pb-1 mb-1.5">
            {typeof label === "number" ? `Nilai: ${label}` : label}
          </div>
        )}
        {payload.map((entry, index) => {
          const rawVal = entry.value;
          const displayColor = entry.color || entry.fill || "#3b82f6";
          let formattedVal: string = "";

          if (typeof rawVal === "number") {
            if (valueFormatter) {
              formattedVal = valueFormatter(rawVal);
            } else if (rawVal <= 1 && rawVal > 0 && entry.name !== "threshold") {
              formattedVal = `${(rawVal * 100).toFixed(1)}%`;
            } else {
              formattedVal = rawVal.toLocaleString();
            }
          } else {
            formattedVal = String(rawVal ?? "");
          }

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: displayColor }}
                />
                <span className="text-slate-300 font-medium">{entry.name || "Jumlah"}</span>
              </div>
              <span className="font-bold font-mono text-white">
                {formattedVal}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};
