import { UserPlan } from '@prisma/client';
import { env } from '../../config/env';

export const ORG_PLANS = ['community', 'partner', 'network'] as const;
export type OrgPlanId = (typeof ORG_PLANS)[number];

export const BILLABLE_PLANS: OrgPlanId[] = ['partner', 'network'];

export const PLAN_HIERARCHY: Record<OrgPlanId, number> = {
  community: 0,
  partner: 1,
  network: 2,
};

export interface PlanConfig {
  id: OrgPlanId;
  displayName: string;
  /** Annual amount in cents — validated on backend only */
  annualAmountCents: number;
  stripePriceId: string | null;
}

export function isMockStripeMode(): boolean {
  return env.MOCK_STRIPE_PAYMENTS || env.STRIPE_SECRET_KEY.includes('placeholder');
}

export function getPlanConfig(plan: string): PlanConfig | null {
  const configs = getAllPlanConfigs();
  return configs[plan as OrgPlanId] ?? null;
}

export function getAllPlanConfigs(): Record<OrgPlanId, PlanConfig> {
  return {
    community: {
      id: 'community',
      displayName: 'Community',
      annualAmountCents: 0,
      stripePriceId: null,
    },
    partner: {
      id: 'partner',
      displayName: 'Partner Org',
      annualAmountCents: 358_800, // $3,588/year ($299/mo)
      stripePriceId: env.STRIPE_PRICE_PARTNER_ANNUAL || 'price_momplan_partner_annual',
    },
    network: {
      id: 'network',
      displayName: 'Network',
      annualAmountCents: 898_800, // $8,988/year ($749/mo)
      stripePriceId: env.STRIPE_PRICE_NETWORK_ANNUAL || 'price_momplan_network_annual',
    },
  };
}

export function assertBillablePlan(plan: string): PlanConfig {
  const config = getPlanConfig(plan);
  if (!config || config.id === 'community') {
    throw new Error('Invalid billable plan');
  }
  return config;
}

export function toUserPlan(plan: string): UserPlan {
  if (!ORG_PLANS.includes(plan as OrgPlanId)) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  return plan as UserPlan;
}

export function isUpgrade(fromPlan: UserPlan, toPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[fromPlan as OrgPlanId] < PLAN_HIERARCHY[toPlan as OrgPlanId];
}
