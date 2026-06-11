"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { getSubscriptionStatus, PLAN_LABELS, type OrgPlan } from "@/lib/billing";

export default function BillingSuccessClient() {
  const searchParams = useSearchParams();
  const { user, refreshSession, updateUser } = useAuthStore();
  const [billing, setBilling] = useState<{
    plan: OrgPlan;
    status: string;
    next_billing_date: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryPlan = searchParams.get("plan") as OrgPlan | null;
  const isMock = searchParams.get("mock") === "true";

  useEffect(() => {
    async function load() {
      try {
        await refreshSession();
        const status = await getSubscriptionStatus();
        setBilling({
          plan: status.plan,
          status: status.status,
          next_billing_date: status.next_billing_date,
        });
        updateUser({ plan: status.plan });
      } catch {
        if (queryPlan) {
          setBilling({
            plan: queryPlan,
            status: "active",
            next_billing_date: null,
          });
          updateUser({ plan: queryPlan });
        } else {
          setError("We couldn't load your subscription details. Your payment may still be processing.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [queryPlan, refreshSession, updateUser]);

  const plan = billing?.plan ?? user?.plan ?? "community";

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="font-display font-bold text-2xl text-on-surface mb-2">
            {loading ? "Confirming your subscription…" : "You're all set!"}
          </h1>
          <p className="text-sm text-on-surface-variant mb-6">
            {isMock
              ? "Mock payment succeeded — your plan is active for local testing."
              : "Your subscription has been activated successfully."}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {error}
            </div>
          )}

          {!loading && (
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium text-on-surface">Current Plan</span>
                </div>
                <PlanBadge plan={plan} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-on-surface">Status</span>
                </div>
                <span className="text-sm font-semibold text-emerald-700 capitalize">
                  {billing?.status ?? "active"}
                </span>
              </div>

              {billing?.next_billing_date && plan !== "community" && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-on-surface">Next Billing Date</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {new Date(billing.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {plan === "community" && (
                <p className="text-xs text-on-surface-variant text-center">
                  Community plan is free — no billing date applies.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="md">
                Manage Subscription
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-on-surface-variant">
            Plan: {PLAN_LABELS[plan as OrgPlan] ?? plan}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
