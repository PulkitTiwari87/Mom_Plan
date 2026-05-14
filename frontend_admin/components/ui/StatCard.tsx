import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: number; // percentage change e.g. +12, -5
  changeLabel?: string;
  color?: "brand" | "green" | "yellow" | "red" | "blue";
  loading?: boolean;
}

const colorMap = {
  brand: {
    icon: "bg-brand-500/15 text-brand-400",
    glow: "shadow-glow-brand",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-400",
    glow: "",
  },
  yellow: {
    icon: "bg-amber-500/15 text-amber-400",
    glow: "",
  },
  red: {
    icon: "bg-rose-500/15 text-rose-400",
    glow: "",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    glow: "",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = "brand",
  loading = false,
}: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="space-y-2 mt-1">
          <div className="skeleton h-7 w-24" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card card-hover group">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
              isPositive && "text-emerald-400 bg-emerald-500/10",
              isNegative && "text-rose-400 bg-rose-500/10",
              !isPositive && !isNegative && "text-slate-400 bg-slate-800"
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-slate-500 mt-0.5 font-medium">{label}</div>
        {changeLabel && (
          <div className="text-xs text-slate-600 mt-1">{changeLabel}</div>
        )}
      </div>
    </div>
  );
}
