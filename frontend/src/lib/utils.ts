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
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
] as const;

export type QuarterDueDatesByYear = Record<number, Partial<Record<Quarter, string[]>>>;

export function buildYearFilterOptions(availableYears: number[]) {
  return [
    { value: "all", label: "All Years" },
    ...availableYears.map((year) => ({ value: String(year), label: String(year) })),
  ];
}

function flattenQuarterRecords(
  quarterDueDatesByYear: QuarterDueDatesByYear | undefined
): Array<{ year: number; quarter: Quarter; dueDates: string[] }> {
  if (!quarterDueDatesByYear) return [];

  const records: Array<{ year: number; quarter: Quarter; dueDates: string[] }> = [];
  for (const [yearStr, quarters] of Object.entries(quarterDueDatesByYear)) {
    const year = Number(yearStr);
    if (!Number.isFinite(year)) continue;

    for (const [quarter, dueDates] of Object.entries(quarters ?? {})) {
      if (!dueDates?.length) continue;
      records.push({ year, quarter: quarter as Quarter, dueDates });
    }
  }
  return records;
}

function getRelevantDueDateInQuarter(
  dueDates: string[],
  referenceDate: Date = new Date()
): string | null {
  if (dueDates.length === 0) return null;

  const todayUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const sorted = [...dueDates].sort();
  for (const dateStr of sorted) {
    const parsed = new Date(`${dateStr}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() >= todayUtc) {
      return dateStr;
    }
  }

  return sorted[sorted.length - 1] ?? null;
}

function getNextUpcomingDueDateFromRecords(
  records: Array<{ year: number; quarter: Quarter; dueDates: string[] }>,
  referenceDate: Date = new Date()
): string | null {
  const todayUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const allDates = records
    .flatMap((record) => record.dueDates)
    .map((dateStr) => new Date(`${dateStr}T00:00:00.000Z`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  for (const date of allDates) {
    if (date.getTime() >= todayUtc) {
      return date.toISOString().slice(0, 10);
    }
  }

  return null;
}

function getMostRecentPastDueDateFromRecords(
  records: Array<{ year: number; quarter: Quarter; dueDates: string[] }>,
  referenceDate: Date = new Date()
): string | null {
  const todayUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const allDates = records
    .flatMap((record) => record.dueDates)
    .map((dateStr) => new Date(`${dateStr}T00:00:00.000Z`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  for (const date of allDates) {
    if (date.getTime() < todayUtc) {
      return date.toISOString().slice(0, 10);
    }
  }

  return null;
}

function getPrimaryDueDateFromRecords(
  records: Array<{ year: number; quarter: Quarter; dueDates: string[] }>,
  yearFilter: string,
  quarterFilter: string,
  referenceDate: Date = new Date()
): string | null {
  const year = yearFilter === "all" ? "all" : Number(yearFilter);
  const quarter = quarterFilter as Quarter;

  const filtered = records.filter((record) => {
    if (year !== "all" && record.year !== year) return false;
    if (record.quarter !== quarter) return false;
    return true;
  });

  if (filtered.length === 0) return null;

  const quarterDates = filtered.flatMap((record) => record.dueDates);
  return getRelevantDueDateInQuarter(quarterDates, referenceDate);
}

export function getProgramDueDateDisplay(
  quarterDueDatesByYear: QuarterDueDatesByYear | undefined,
  yearFilter: string,
  quarterFilter: string
): { quarter: string | null; year: number | null; dueDate: string | null } {
  const records = flattenQuarterRecords(quarterDueDatesByYear);
  const dueDate = getPrimaryDueDateFromRecords(records, yearFilter, quarterFilter);
  if (!dueDate) {
    return { quarter: null, year: null, dueDate: null };
  }

  const parsed = new Date(`${dueDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { quarter: null, year: null, dueDate: null };
  }

  const month = parsed.getUTCMonth() + 1;
  let quarter: Quarter = "Q4";
  if (month <= 3) quarter = "Q1";
  else if (month <= 6) quarter = "Q2";
  else if (month <= 9) quarter = "Q3";

  return {
    quarter,
    year: parsed.getUTCFullYear(),
    dueDate,
  };
}

export function getCurrentQuarterYear(): { quarter: Quarter; year: number } {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  let quarter: Quarter = "Q4";
  if (month <= 3) quarter = "Q1";
  else if (month <= 6) quarter = "Q2";
  else if (month <= 9) quarter = "Q3";
  return { quarter, year: now.getUTCFullYear() };
}

export function resolveQuarterYearForPdf(
  quarterFilter: string,
  yearFilter: string = "all"
): { quarter: Quarter; year: number } {
  const current = getCurrentQuarterYear();
  const quarter = ["Q1", "Q2", "Q3", "Q4"].includes(quarterFilter)
    ? (quarterFilter as Quarter)
    : current.quarter;
  const parsedYear = yearFilter === "all" ? NaN : Number(yearFilter);
  const year = Number.isFinite(parsedYear) ? parsedYear : current.year;
  return { quarter, year };
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
    overdue: "Overdue",
    due_soon: "Due Soon",
    upcoming: "Upcoming",
    federal: "Federal",
    state: "State",
  };
  return labels[status] || slugToTitle(status);
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}
