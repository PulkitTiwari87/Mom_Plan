"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Check, ArrowRight, Shield, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import {
  getSubscriptionStatus,
  startCheckout,
  upgradePlan,
  cancelSubscription,
  reactivateSubscription,
  openBillingPortal,
  activateCommunityPlan,
  type OrgPlan,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

const plans: {
  name: OrgPlan;
  displayName: string;
  price: string;
  period: string;
  billing: string;
  features: string[];
}[] = [
  {
    name: "community",
    displayName: "Community",
    price: "$0",
    period: "/month",
    billing: "Free for qualifying 501(c)(3)s",
    features: [
      "Basic caseworker case queue",
      "Mother profile viewer",
      "Application status tracking",
      "Renewal deadline alerts",
    ],
  },
  {
    name: "partner",
    displayName: "Partner Org",
    price: "$299",
    period: "/month",
    billing: "Billed annually ($3,588/yr)",
    features: [
      "Full caseworker dashboard",
      "Organization admin dashboard",
      "Outcomes reporting",
      "Two-way referral network access",
    ],
  },
  {
    name: "network",
    displayName: "Network",
    price: "$749",
    period: "/month",
    billing: "Billed annually ($8,988/yr)",
    features: [
      "Unlimited active cases",
      "Custom report builder",
      "Multi-site / branch management",
      "Priority email & phone support",
    ],
  },
];

export default function SettingsPageClient() {
  const { user, refreshSession, updateUser } = useAuthStore();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "cancelled") {
      setBanner({ type: "info", message: "Checkout was cancelled. No charges were made." });
    }
  }, [searchParams]);

  const { data: billing } = useQuery({
    queryKey: ["billing-status"],
    queryFn: getSubscriptionStatus,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status"] });
      refreshSession();
      setBanner({ type: "info", message: "Your subscription will cancel at the end of the billing period." });
    },
    onError: () => setBanner({ type: "error", message: "Failed to cancel subscription. Please try again." }),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status"] });
      refreshSession();
      setBanner({ type: "info", message: "Your subscription has been reactivated." });
    },
    onError: () => setBanner({ type: "error", message: "Failed to reactivate subscription." }),
  });

  const handlePlanAction = async (planName: OrgPlan) => {
    if (planName === user?.plan) return;

    setCheckoutLoading(planName);
    setBanner(null);
    try {
      if (planName === "community") {
        await activateCommunityPlan();
        await refreshSession();
        updateUser({ plan: "community" });
        queryClient.invalidateQueries({ queryKey: ["billing-status"] });
      } else if (user?.plan === "community") {
        const { url } = await startCheckout(planName);
        window.location.href = url;
      } else {
        const result = await upgradePlan(planName);
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          await refreshSession();
          updateUser({ plan: planName });
          queryClient.invalidateQueries({ queryKey: ["billing-status"] });
        }
      }
    } catch {
      setBanner({ type: "error", message: "Unable to change plan. Please try again or contact support." });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
      setBanner({ type: "error", message: "Unable to open billing portal." });
    }
  };

  const renewalDate = billing?.next_billing_date ?? billing?.current_period_end;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Settings & Billing
        </h1>
        <p className="text-sm text-on-surface-variant">Manage your organization subscription</p>
      </div>

      {banner && (
        <div
          className={cn(
            "mb-6 p-4 rounded-xl flex items-start gap-3 text-sm",
            banner.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-blue-50 border border-blue-200 text-blue-700"
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {banner.message}
        </div>
      )}

      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-semibold text-on-surface">Current Plan</span>
              <PlanBadge plan={user?.plan || "community"} />
            </div>
            <p className="text-sm text-on-surface-variant">
              {billing?.status === "active" && user?.plan !== "community"
                ? `Subscription active${renewalDate ? ` • Next renewal: ${new Date(renewalDate).toLocaleDateString()}` : ""}`
                : billing?.cancel_at_period_end
                  ? `Cancels at period end${renewalDate ? ` • ${new Date(renewalDate).toLocaleDateString()}` : ""}`
                  : user?.plan === "community"
                    ? "Community plan — free for qualifying organizations"
                    : "Upgrade to unlock organization features"}
            </p>
          </div>
          <div className="flex gap-2">
            {billing?.cancel_at_period_end ? (
              <Button
                variant="secondary"
                size="sm"
                loading={reactivateMutation.isPending}
                onClick={() => reactivateMutation.mutate()}
              >
                Reactivate
              </Button>
            ) : user?.plan !== "community" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={portalLoading}
                  onClick={handlePortal}
                >
                  Manage Billing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Cancel
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <h2 className="font-display font-semibold text-xl text-on-surface mb-4">Choose Your Plan</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-8 pt-4">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.name;
          const isPopular = plan.name === "partner";
          const canUpgrade =
            plans.findIndex((p) => p.name === user?.plan) < plans.findIndex((p) => p.name === plan.name);

          return (
            <motion.div key={plan.name} whileHover={{ y: -4 }} className="relative flex flex-col">
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-gradient-primary rounded-full text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-primary/20 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <Card
                padding="lg"
                className={cn(
                  "h-full flex flex-col",
                  isCurrent ? "border-2 border-primary-400 shadow-xl shadow-primary/10 ring-4 ring-primary-50" : "border-outline-variant/50"
                )}
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-xl text-on-surface">{plan.displayName}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-tight">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-display font-bold text-4xl text-on-surface">{plan.price}</span>
                    <span className="text-on-surface-variant text-sm mb-1.5">{plan.period}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">{plan.billing}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary-50 text-primary-500">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-on-surface-variant leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container text-on-surface-variant text-sm font-bold border border-outline-variant">
                    <Check className="w-4 h-4" />
                    Your Current Plan
                  </div>
                ) : canUpgrade ? (
                  <Button
                    variant={isPopular ? "primary" : "outline"}
                    size="md"
                    className="w-full rounded-xl"
                    loading={checkoutLoading === plan.name}
                    onClick={() => handlePlanAction(plan.name)}
                  >
                    {plan.name === "community" ? "Switch to Community" : `Upgrade to ${plan.displayName}`}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="md" className="w-full rounded-xl" disabled>
                    Downgrade via support
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-surface-container-low" glass={false}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm text-on-surface mb-1">Secure Payments via Stripe</div>
            <p className="text-xs text-on-surface-variant">
              All payments are processed securely by Stripe. We never store your card details. Cancel anytime — access continues until the end of your billing period.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
