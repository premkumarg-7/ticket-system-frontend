export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ValidationApiError extends ApiError {
  fieldErrors: Record<string, string>;
}
