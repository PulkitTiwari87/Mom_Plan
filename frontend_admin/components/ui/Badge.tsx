import { cn, getStatusVariant, slugToTitle } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "purple" | "gray";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "gray", className, dot }: BadgeProps) {
  return (
    <span className={cn(`badge-${variant}`, className)}>
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-emerald-400": variant === "green",
            "bg-amber-400": variant === "yellow",
            "bg-rose-400": variant === "red",
            "bg-blue-400": variant === "blue",
            "bg-brand-400": variant === "purple",
            "bg-slate-400": variant === "gray",
          })}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = getStatusVariant(status);
  return (
    <Badge variant={variant} dot>
      {slugToTitle(status)}
    </Badge>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    free: "gray",
    family: "purple",
    navigator: "blue",
  };
  return (
    <Badge variant={variantMap[plan] ?? "gray"}>
      {slugToTitle(plan)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    admin: "red",
    counselor: "blue",
    user: "gray",
  };
  return (
    <Badge variant={variantMap[role] ?? "gray"}>
      {slugToTitle(role)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    high: "red",
    medium: "yellow",
    low: "green",
  };
  return (
    <Badge variant={variantMap[priority] ?? "gray"}>
      {slugToTitle(priority)}
    </Badge>
  );
}
