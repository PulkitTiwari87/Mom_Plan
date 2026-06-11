"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { buildYearFilterOptions, getCurrentQuarterYear, QUARTER_FILTER_OPTIONS } from "@/lib/utils";

const PROGRAM_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
];

const selectClassName =
  "w-full appearance-none rounded-lg border border-outline-variant/60 bg-white py-2.5 pl-3 pr-9 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer";

type DashboardItem = {
  programId: string;
  programName: string;
  federalOrState: string;
  nextDueDate: string;
  daysRemaining: number;
  status: "overdue" | "due_soon" | "upcoming";
};

function getScopeBadgeStatus(federalOrState: string): "federal" | "state" {
  return federalOrState.toLowerCase().includes("federal") ? "federal" : "state";
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
  if (daysRemaining < 0) return "Overdue";
  if (daysRemaining === 0) return "Today";
  return `${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`;
}

function getDaysRemainingColor(status: DashboardItem["status"]): string {
  switch (status) {
    case "overdue":
      return "text-red-600";
    case "due_soon":
      return "text-orange-600";
    default:
      return "text-on-surface";
  }
}

function getRowAccent(status: DashboardItem["status"]): string {
  switch (status) {
    case "overdue":
      return "bg-red-50";
    case "due_soon":
      return "bg-orange-50";
    default:
      return "bg-white";
  }
}

type DashboardResponse = {
  items: DashboardItem[];
  availableYears: number[];
};

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

  const overdueCount = items.filter((item) => item.status === "overdue").length;
  const dueSoonCount = items.filter((item) => item.status === "due_soon").length;
  const upcomingCount = items.filter((item) => item.status === "upcoming").length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Overdue", count: overdueCount, color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
          { label: "Due Soon", count: dueSoonCount, color: "text-orange-600", bg: "bg-orange-50", icon: Clock },
          { label: "Upcoming", count: upcomingCount, color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <Card key={label} padding="sm" hover>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold font-display ${color}`}>{count}</div>
                <div className="text-xs text-on-surface-variant">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 relative">
        {isFetching && !isLoading && (
          <div className="absolute -top-6 right-0 text-xs text-on-surface-variant flex items-center gap-1.5">
            <Clock className="w-3 h-3 animate-spin" />
            Updating...
          </div>
        )}
        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="deadline-year-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Year
          </label>
          <div className="relative">
            <select
              id="deadline-year-filter"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectClassName}
            >
              {yearFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="deadline-quarter-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Quarter
          </label>
          <div className="relative">
            <select
              id="deadline-quarter-filter"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as "Q1" | "Q2" | "Q3" | "Q4")}
              className={selectClassName}
            >
              {QUARTER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="deadline-program-type" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Program Type
          </label>
          <div className="relative">
            <select
              id="deadline-program-type"
              value={programType}
              onChange={(e) => setProgramType(e.target.value as "all" | "federal" | "state")}
              className={selectClassName}
            >
              {PROGRAM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card padding="md">
          <TableSkeleton rows={5} />
        </Card>
      ) : items.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Calendar className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="font-medium text-on-surface mb-1">No renewal deadlines found</p>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            {hasActiveFilters
              ? "Try adjusting your filters to see more program renewal dates."
              : "Complete your eligibility scan to see upcoming program renewal deadlines for your matched benefits."}
          </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Program Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Days Remaining
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {items.map((item) => (
                  <tr key={item.programId} className={getRowAccent(item.status)}>
                    <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                      {item.programName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={getScopeBadgeStatus(item.federalOrState)} />
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold whitespace-nowrap ${getDaysRemainingColor(item.status)}`}
                    >
                      {getDaysRemainingLabel(item.daysRemaining)}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {formatTableDate(item.nextDueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
