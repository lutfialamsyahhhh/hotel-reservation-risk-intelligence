import {
  BenchmarkResponse,
  BulkPredictionResponse,
  HealthStatusResponse,
  PredictionResponse,
  SingleBookingPayload,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch health status of the FastAPI backend and model readiness.
 */
export async function getHealth(): Promise<HealthStatusResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Healthcheck failed with status: ${res.status}`);
    }
    return await res.json();
  } catch {
    return {
      status: "unreachable",
      service: "hotel-booking-cancellation-api",
      model_loaded: false,
      optimal_threshold: 0.54,
      log_file_exists: false,
      environment: "offline",
    };
  }
}

export const checkHealth = getHealth;

/**
 * Fetch 3-model comparative benchmark results and threshold scanning data.
 */
export async function getBenchmark(): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE_URL}/models/benchmark`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Gagal mengambil data benchmark model.");
  }
  return await res.json();
}

export const getBenchmarkData = getBenchmark;

/**
 * Send a single reservation payload for real-time cancellation prediction.
 */
export async function predictSingle(
  payload: SingleBookingPayload
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Prediksi gagal (Status ${res.status}).`);
  }
  return await res.json();
}

/**
 * Upload a CSV file for batch reservation risk prediction.
 */
export async function predictBulk(file: File): Promise<BulkPredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/predict/bulk`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Gagal memproses file bulk (Status ${res.status}).`
    );
  }
  return await res.json();
}
