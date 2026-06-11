import { z } from 'zod';

const billablePlanSchema = z.enum(['partner', 'network']);

export const checkoutBodySchema = z.object({
  body: z.object({
    plan: billablePlanSchema,
  }),
});

export const upgradeBodySchema = z.object({
  body: z.object({
    plan: billablePlanSchema,
  }),
});

export const activateCommunityBodySchema = z.object({
  body: z.object({}).optional(),
});
