/**
 * Single API client for the TeamSync AI backend.
 *
 * FastAPI returns two different error shapes and both are normalized here:
 *   { "detail": "Project ... not found" }                        -> message
 *   { "detail": [ { loc: ["body","status"], msg: "..." } ] }      -> fieldErrors
 */

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** A short line safe to show the user for any status we might get. */
  get friendly(): string {
    switch (this.status) {
      case 0:
        return "Can't reach the server. Is the backend running on port 8000?";
      case 400:
        return this.message;
      case 404:
        return this.message || "Not found.";
      case 422:
        return Object.values(this.fieldErrors)[0] ?? "Some fields need fixing.";
      case 502:
        return "The AI service returned something unexpected.";
      case 503:
        return "That service is unavailable right now. Try again.";
      default:
        return this.status >= 500 ? "Something went wrong on the server." : this.message;
    }
  }
}

interface FastApiValidationItem {
  loc: (string | number)[];
  msg: string;
}

function parseError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of detail as FastApiValidationItem[]) {
      // loc looks like ["body", "status"] — the last string is the field.
      const field = [...item.loc].reverse().find((p) => typeof p === "string" && p !== "body");
      if (typeof field === "string") fieldErrors[field] = item.msg;
    }
    const first = Object.entries(fieldErrors)[0];
    return new ApiError(status, first ? `${first[0]}: ${first[1]}` : "Validation failed", fieldErrors);
  }

  if (typeof detail === "string") return new ApiError(status, detail);
  return new ApiError(status, `Request failed (${status})`);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(0, aborted ? "The request timed out." : "Network error.");
  }
  clearTimeout(timer);

  if (response.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) throw parseError(response.status, body);
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
};

export { BASE_URL };
