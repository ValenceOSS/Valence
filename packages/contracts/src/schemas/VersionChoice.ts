import { z } from 'zod';

const VersionChoiceSchema = z.object({
  label: z.string().trim().max(64).nullable().optional(),
  isStanding: z.literal(true).optional(),
});

type VersionChoiceRequest = z.infer<typeof VersionChoiceSchema>;

export type { VersionChoiceRequest };

export { VersionChoiceSchema };
