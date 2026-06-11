"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { activateCommunityPlan, startCheckout } from "@/lib/billing";

type PricingCtaProps = {
  planId: "community" | "partner" | "network" | "enterprise";
  label: string;
  href: string;
  variant?: "outline" | "solid";
  className?: string;
};

function registerUrlForPlan(planId: PricingCtaProps["planId"]): string {
  if (planId === "enterprise") return "/contact";
  if (planId === "community") return "/register?plan=community";
  return `/register?plan=${planId}`;
}

export function PricingCta({ planId, label, href, variant = "outline", className }: PricingCtaProps) {
  const router = useRouter();
  const { isHydrated, isInitializing, ensureSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (planId === "enterprise") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
          variant === "solid"
            ? "bg-gradient-primary text-white shadow-primary hover:shadow-primary-lg"
            : "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low hover:border-primary-200",
          className
        )}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  const handleClick = async () => {
    setError("");
    setLoading(true);

    try {
      const sessionActive = await ensureSession();
      if (!sessionActive) {
        router.push(registerUrlForPlan(planId));
        return;
      }

      if (planId === "community") {
        await activateCommunityPlan();
        router.push("/dashboard/billing/success?plan=community");
      } else {
        const { url } = await startCheckout(planId);
        window.location.href = url;
      }
    } catch {
      const retrySession = await ensureSession();
      if (!retrySession) {
        router.push(registerUrlForPlan(planId));
        return;
      }
      setError("Something went wrong. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const authPending = !isHydrated || isInitializing;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || authPending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60",
          variant === "solid"
            ? "bg-gradient-primary text-white shadow-primary hover:shadow-primary-lg"
            : "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low hover:border-primary-200",
          className
        )}
      >
        {loading || authPending ? "Loading…" : label}
        {!loading && !authPending && <ArrowRight className="h-3.5 w-3.5" />}
      </button>
      {error && <p className="mt-2 text-[11px] text-red-600 text-center">{error}</p>}
    </div>
  );
}
