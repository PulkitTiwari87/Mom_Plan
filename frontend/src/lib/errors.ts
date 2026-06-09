const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Invalid credentials. Please try again.",
  403: "You do not have permission to do that.",
  404: "The requested resource was not found.",
  429: "Too many attempts. Please wait and try again.",
  500: "Something went wrong. Please try again later.",
  503: "Service temporarily unavailable. Please try again.",
};

const TECHNICAL_PATTERNS = [
  "prisma",
  "invocation",
  "column",
  "database",
  "sql",
  "econnrefused",
  "enotfound",
  "stack",
  "exception",
  "/users/",
  "node_modules",
  "findunique",
  "refresh_token",
];

function isSafeUserMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized || normalized.length > 160) return false;
  if (message.includes("\n")) return false;
  return !TECHNICAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: {
      error?: { message?: string };
      message?: string;
    };
  };
  message?: string;
};

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const error = err as ApiErrorLike;
  const status = error.response?.status;
  const raw =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message;

  if (typeof raw === "string" && isSafeUserMessage(raw)) {
    return raw;
  }

  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  return fallback;
}
