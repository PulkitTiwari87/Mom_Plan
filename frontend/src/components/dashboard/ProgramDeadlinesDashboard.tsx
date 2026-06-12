"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, Clock } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { buildYearFilterOptions, getCurrentQuarterYear, QUARTER_FILTER_OPTIONS } from "@/lib/utils";

const PROGRAM_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
];

const selectClassName =
  "w-full appearance-none rounded-full border border-[#D1C4E9] bg-white/90 py-2 pl-3 pr-9 text-sm text-[#4A148C] focus:outline-none focus:ring-2 focus:ring-[#B39DDB] cursor-pointer";

type DashboardItem = {
  programId: string;
  programName: string;
  federalOrState: string;
  nextDueDate: string;
  daysRemaining: number;
  status: "overdue" | "due_soon" | "upcoming";
};

type DashboardResponse = {
  items: DashboardItem[];
  availableYears: number[];
};

function getProgramEmoji(programName: string): string {
  const name = programName.toLowerCase();
  if (name.includes("snap") || name.includes("food stamp")) return "🛒";
  if (name.includes("section 8") || name.includes("housing") || name.includes("voucher")) return "🏠";
  if (name.includes("medicaid") || name.includes("chip")) return "💊";
  if (name.includes("legal aid") || name.includes("legal")) return "⚖️";
  if (name.includes("liheap") || name.includes("energy")) return "💡";
  if (name.includes("pell") || name.includes("grant") || name.includes("education")) return "🎓";
  if (name.includes("lifeline") || name.includes("phone") || name.includes("internet")) return "📱";
  if (name.includes("eitc") || name.includes("tax credit") || name.includes("earned income")) return "💰";
  if (name.includes("wic")) return "🍼";
  if (name.includes("childcare") || name.includes("child care")) return "👶";
  if (name.includes("tanf") || name.includes("cash assistance")) return "💵";
  return "📋";
}

function getScopeLabel(federalOrState: string): string {
  return federalOrState.toLowerCase().includes("federal") ? "FEDERAL" : "STATE";
}

function formatTableDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getDaysRemainingLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} Days Overdue`;
  if (daysRemaining === 0) return "Today";
  return `${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`;
}

function isUrgentDaysBadge(item: DashboardItem): boolean {
  return item.status === "overdue" || item.status === "due_soon" || item.daysRemaining <= 30;
}

export default function ProgramDeadlinesDashboard() {
  const [programType, setProgramType] = useState<"all" | "federal" | "state">("all");
  const [year, setYear] = useState("all");
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">(
    () => getCurrentQuarterYear().quarter
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["deadlines-dashboard", programType, year, quarter],
    queryFn: () =>
      api
        .get("/api/deadlines/dashboard", {
          params: { type: programType, year, quarter },
        })
        .then((r) => r.data.data as DashboardResponse),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const items = data?.items ?? [];
  const yearFilterOptions = buildYearFilterOptions(data?.availableYears ?? []);
  const hasActiveFilters = programType !== "all" || year !== "all";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5 relative">
        {isFetching && !isLoading && (
          <div className="absolute -top-5 right-0 text-xs text-[#7E57C2] flex items-center gap-1.5">
            <Clock className="w-3 h-3 animate-spin" />
            Updating...
          </div>
        )}
        <div className="flex-1 min-w-[9rem]">
          <label htmlFor="deadline-year-filter" className="sr-only">
            Year
          </label>
          <div className="relative">
            <select
              id="deadline-year-filter"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectClassName}
              aria-label="Filter by year"
            >
              {yearFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E57C2]" />
          </div>
        </div>

        <div className="flex-1 min-w-[9rem]">
          <label htmlFor="deadline-quarter-filter" className="sr-only">
            Quarter
          </label>
          <div className="relative">
            <select
              id="deadline-quarter-filter"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as "Q1" | "Q2" | "Q3" | "Q4")}
              className={selectClassName}
              aria-label="Filter by quarter"
            >
              {QUARTER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E57C2]" />
          </div>
        </div>

        <div className="flex-1 min-w-[9rem]">
          <label htmlFor="deadline-program-type" className="sr-only">
            Program Type
          </label>
          <div className="relative">
            <select
              id="deadline-program-type"
              value={programType}
              onChange={(e) => setProgramType(e.target.value as "all" | "federal" | "state")}
              className={selectClassName}
              aria-label="Filter by program type"
            >
              {PROGRAM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E57C2]" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(126,87,194,0.12)] overflow-hidden p-6">
          <TableSkeleton rows={5} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(126,87,194,0.12)] text-center px-6 py-14">
          <Calendar className="w-10 h-10 text-[#B39DDB] mx-auto mb-3" />
          <p className="font-semibold text-[#4A148C] mb-1">No renewal deadlines found</p>
          <p className="text-sm text-[#7E57C2] max-w-md mx-auto">
            {hasActiveFilters
              ? "Try adjusting your filters to see more program renewal dates."
              : "Complete your eligibility scan to see upcoming program renewal deadlines for your matched benefits."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(126,87,194,0.12)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#9575CD] via-[#7E57C2] to-[#673AB7]">
                  <th className="px-5 py-4 text-left text-[11px] font-extrabold tracking-wider text-white uppercase">
                    Program Name
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-extrabold tracking-wider text-white uppercase">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-extrabold tracking-wider text-white uppercase">
                    Days Remaining
                  </th>
                  <th className="px-5 py-4 text-right text-[11px] font-extrabold tracking-wider text-white uppercase">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {items.map((item, index) => {
                  const urgent = isUrgentDaysBadge(item);
                  return (
                    <tr
                      key={item.programId}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#F8F4FC]"}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2.5 font-extrabold text-[#4A148C]">
                          <span className="text-base leading-none" aria-hidden>
                            {getProgramEmoji(item.programName)}
                          </span>
                          {item.programName}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide bg-[#EDE7F6] text-[#6A1B9A]">
                          {getScopeLabel(item.federalOrState)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            urgent
                              ? "border-[#F06292] text-[#C2185B] bg-[#FCE4EC]/40"
                              : "border-[#7986CB] text-[#3949AB] bg-[#E8EAF6]/50"
                          }`}
                        >
                          <span className="text-sm leading-none" aria-hidden>
                            {urgent ? "⏰" : "📅"}
                          </span>
                          {getDaysRemainingLabel(item.daysRemaining)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-[#4A148C] whitespace-nowrap">
                        {formatTableDate(item.nextDueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
