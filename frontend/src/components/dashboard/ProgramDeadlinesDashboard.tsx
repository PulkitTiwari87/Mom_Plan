"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const PROGRAM_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
];

const QUARTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
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

function getDaysLabel(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  }
  if (daysRemaining === 0) return "Due today";
  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
}

function getRowAccent(status: DashboardItem["status"]): string {
  switch (status) {
    case "overdue":
      return "bg-red-50 border-red-100";
    case "due_soon":
      return "bg-orange-50 border-orange-100";
    default:
      return "bg-surface-container-low border-transparent";
  }
}

export default function ProgramDeadlinesDashboard() {
  const [programType, setProgramType] = useState<"all" | "federal" | "state">("all");
  const [quarter, setQuarter] = useState<"all" | "Q1" | "Q2" | "Q3" | "Q4">("all");

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ["deadlines-dashboard", programType, quarter],
    queryFn: () =>
      api
        .get("/api/deadlines/dashboard", {
          params: { type: programType, quarter },
        })
        .then((r) => r.data.data as DashboardItem[]),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

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

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="deadline-quarter-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Quarter
          </label>
          <div className="relative">
            <select
              id="deadline-quarter-filter"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as "all" | "Q1" | "Q2" | "Q3" | "Q4")}
              className={selectClassName}
            >
              {QUARTER_OPTIONS.map((option) => (
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
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Calendar className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="font-medium text-on-surface mb-1">No renewal deadlines found</p>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            {programType !== "all" || quarter !== "all"
              ? "Try adjusting your filters to see more program renewal dates."
              : "Complete your eligibility scan to see upcoming program renewal deadlines for your matched benefits."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.programId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card padding="sm" className={`border ${getRowAccent(item.status)}`} hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm text-on-surface">{item.programName}</h3>
                      <StatusBadge status={getScopeBadgeStatus(item.federalOrState)} />
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>Next due {formatDate(item.nextDueDate)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-on-surface shrink-0 sm:text-right">
                    {getDaysLabel(item.daysRemaining)}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
