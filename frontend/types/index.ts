export interface SingleBookingPayload {
  hotel: string;
  lead_time: number;
  arrival_date_year: number;
  arrival_date_month: string;
  arrival_date_week_number: number;
  arrival_date_day_of_month: number;
  stays_in_weekend_nights: number;
  stays_in_week_nights: number;
  adults: number;
  children: number;
  babies: number;
  meal: string;
  country: string;
  market_segment: string;
  distribution_channel: string;
  is_repeated_guest: number;
  previous_cancellations: number;
  previous_bookings_not_canceled: number;
  reserved_room_type: string;
  assigned_room_type: string;
  booking_changes: number;
  deposit_type: string;
  days_in_waiting_list: number;
  customer_type: string;
  adr: number;
  required_car_parking_spaces: number;
  total_of_special_requests: number;
}

export interface PredictionResponse {
  request_id: string;
  probability: number;
  risk_label: "Rendah" | "Sedang" | "Tinggi";
  threshold_used: number;
  model_name: string;
  model_version: string;
  is_canceled_prediction: number;
}

export interface BulkRowSummary {
  hotel: string;
  lead_time: number;
  adr: number;
  customer_type: string;
}

export interface BulkPredictionRowResult {
  row_id: number;
  probability: number;
  risk_label: "Rendah" | "Sedang" | "Tinggi";
  is_canceled_prediction: number;
  key_summary: BulkRowSummary;
}

export type BulkPredictionRow = BulkPredictionRowResult;

export interface BulkRiskDistribution {
  low_count: number;
  medium_count: number;
  high_count: number;
  cancellation_rate_predicted: number;
}

export interface BulkPredictionResponse {
  total_rows_processed: number;
  execution_time_ms: number;
  risk_distribution: BulkRiskDistribution;
  results: BulkPredictionRowResult[];
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelMetrics {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  log_loss: number;
  confusion_matrix: ConfusionMatrixData;
  training_time_sec?: number;
  inference_latency_ms_per_row?: number;
}

export interface BenchmarkModel {
  name: string;
  type: string;
  metrics_val?: ModelMetrics;
  metrics_val_default?: ModelMetrics;
  metrics_val_optimal?: ModelMetrics;
  metrics_test?: ModelMetrics;
  optimal_threshold?: number;
  training_time_sec: number;
}

export type ModelBenchmarkData = BenchmarkModel;

export interface ThresholdScanPoint {
  threshold: number;
  f1_score: number;
  recall: number;
  precision: number;
  accuracy: number;
}

export interface BenchmarkResponse {
  benchmark_timestamp: string;
  champion: string;
  models: BenchmarkModel[];
  threshold_scan_results: ThresholdScanPoint[];
}

export interface HealthStatusResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  optimal_threshold: number;
  log_file_exists: boolean;
  environment: string;
}
