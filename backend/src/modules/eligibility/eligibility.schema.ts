import { z } from 'zod';

export const getResultParamSchema = z.object({
  params: z.object({
    programId: z.string().min(1),
  }),
});

export const getResultsQuerySchema = z.object({
  query: z.object({
    federal: z.enum(['true', 'false']).optional(),
    state_only: z.enum(['true', 'false']).optional(),
    state: z.string().max(2).optional(),
    state_search: z.string().max(100).optional(),
    year: z.union([z.literal('all'), z.coerce.number().int().positive()]).optional(),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
  }),
});
