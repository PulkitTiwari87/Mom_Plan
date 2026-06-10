import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
  return formatDate(d);
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugToTitle(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export const QUARTER_FILTER_OPTIONS = [
  { value: "all", label: "All Quarters" },
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
] as const;

export function getCurrentQuarterYear(): { quarter: Quarter; year: number } {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  let quarter: Quarter = "Q4";
  if (month <= 3) quarter = "Q1";
  else if (month <= 6) quarter = "Q2";
  else if (month <= 9) quarter = "Q3";
  return { quarter, year: now.getUTCFullYear() };
}

export function resolveQuarterYearForPdf(quarterFilter: string): { quarter: Quarter; year: number } {
  const current = getCurrentQuarterYear();
  if (quarterFilter !== "all" && ["Q1", "Q2", "Q3", "Q4"].includes(quarterFilter)) {
    return { quarter: quarterFilter as Quarter, year: current.year };
  }
  return current;
}

export function formatPdfQuarterYear(pdf: { quarter?: string | null; year?: number | null }): string {
  if (pdf.quarter && pdf.year) return `${pdf.quarter} ${pdf.year}`;
  return "";
}

export function formatPdfFilename(
  programName: string,
  quarter?: string | null,
  year?: number | null,
  version?: number
): string {
  const safeName = (programName || "Application").replace(/\s+/g, "_");
  const quarterPart = quarter && year ? `_${quarter}_${year}` : "";
  const versionPart = version != null ? `_v${version}` : "";
  return `${safeName}_Package${quarterPart}${versionPart}.pdf`;
}

function parseContentDispositionFilename(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

export function getDownloadFilenameFromResponse(
  response: { headers?: Record<string, unknown> },
  fallback: string
): string {
  const headers = response.headers;
  const disposition = headers?.["content-disposition"] ?? headers?.["Content-Disposition"];
  return parseContentDispositionFilename(typeof disposition === "string" ? disposition : undefined) ?? fallback;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    qualified: "Qualified",
    likely_qualified: "Likely Qualified",
    check_required: "Additional Review",
    not_qualified: "Not Qualified",
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    action_required: "Action Required",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };
  return labels[status] || slugToTitle(status);
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}
