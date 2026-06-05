import { isAxiosError } from "axios";

export interface ApiError {
  /** Machine-readable code from backend ErrorCode enum, e.g. "OFFER_NOT_FOUND" */
  code: string;
  status?: number;
  /** Field-level validation errors, present when code === "VALIDATION_ERROR" */
  fieldErrors?: Record<string, string>;
}

/** Extract a structured ApiError from any thrown value. */
export function extractApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;

    if (data?.code) {
      return {
        code: data.code as string,
        status,
        fieldErrors: data.properties?.errors,
      };
    }

    // Fallback based on HTTP status when no code in body
    if (status === 404) return { code: "USER_NOT_FOUND", status };
    if (status === 401) return { code: "MISSING_HEADER", status };
  }

  return { code: "UNKNOWN_ERROR" };
}
