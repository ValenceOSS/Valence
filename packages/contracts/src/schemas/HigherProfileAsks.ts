import { z } from 'zod';

const HIGHER_PROFILE_ASKS = ['ask', 'upgrade', 'keep', 'both'] as const;

const HigherProfileAsksSchema = z.enum(HIGHER_PROFILE_ASKS);

type HigherProfileAsks = z.infer<typeof HigherProfileAsksSchema>;

export type { HigherProfileAsks };

export { HIGHER_PROFILE_ASKS, HigherProfileAsksSchema };
