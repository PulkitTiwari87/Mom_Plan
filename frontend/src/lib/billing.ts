import { api } from "@/lib/api";

export type OrgPlan = "community" | "partner" | "network";

export interface SubscriptionStatus {
  plan: OrgPlan;
  status: string;
  current_period_end: string | null;
  next_billing_date: string | null;
  renewal_date: string | null;
  cancel_at_period_end: boolean;
}

export async function activateCommunityPlan() {
  const res = await api.post("/api/billing/activate-community");
  return res.data.data;
}

export async function startCheckout(plan: "partner" | "network") {
  const res = await api.post("/api/billing/checkout", { plan });
  return res.data.data as { url: string };
}

export async function upgradePlan(plan: "partner" | "network") {
  const res = await api.post("/api/billing/upgrade", { plan });
  return res.data.data as { plan?: OrgPlan; upgraded?: boolean; checkoutUrl?: string };
}

export async function cancelSubscription() {
  const res = await api.post("/api/billing/cancel");
  return res.data.data;
}

export async function reactivateSubscription() {
  const res = await api.post("/api/billing/reactivate");
  return res.data.data;
}

export async function getSubscriptionStatus() {
  const res = await api.get("/api/billing/subscription");
  return res.data.data as SubscriptionStatus;
}

export async function openBillingPortal() {
  const res = await api.post("/api/billing/portal");
  return res.data.data as { url: string };
}

/** Post-registration or pricing-page plan selection handler */
export async function completePlanSelection(plan: string) {
  if (plan === "community" || plan === "free") {
    await activateCommunityPlan();
    return { redirect: "/dashboard/billing/success?plan=community" };
  }
  if (plan === "partner" || plan === "network") {
    const { url } = await startCheckout(plan);
    return { redirect: url };
  }
  return { redirect: "/dashboard" };
}

export const PLAN_LABELS: Record<OrgPlan, string> = {
  community: "Community",
  partner: "Partner Org",
  network: "Network",
};
