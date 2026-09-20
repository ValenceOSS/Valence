import { z } from 'zod';

const ROUNDNESS_LEVELS = ['sharp', 'soft', 'default', 'round'] as const;

const RoundnessSchema = z.enum(ROUNDNESS_LEVELS);

type Roundness = z.infer<typeof RoundnessSchema>;

const ROUNDNESS_SCALES: Readonly<Record<Roundness, number>> = {
  sharp: 0,
  soft: 0.6,
  default: 1,
  round: 1.6,
};

const ROUNDNESS_LABELS: Readonly<Record<Roundness, string>> = {
  sharp: 'Sharp',
  soft: 'Soft',
  default: 'Default',
  round: 'Round',
};

const AppearanceSchema = z.object({ roundness: RoundnessSchema.default('default') });

type Appearance = z.infer<typeof AppearanceSchema>;

export type { Appearance, Roundness };

export { AppearanceSchema, ROUNDNESS_LABELS, ROUNDNESS_LEVELS, ROUNDNESS_SCALES, RoundnessSchema };
