import { z } from 'zod';
import { ExtraKindSchema } from './Library';

const ExtraChoiceRequestSchema = z.object({
  extraKind: ExtraKindSchema.nullable(),
  parentId: z.string().min(1).max(64).nullable(),
  isForgotten: z.boolean().optional(),
});

type ExtraChoiceRequest = z.infer<typeof ExtraChoiceRequestSchema>;

export type { ExtraChoiceRequest };

export { ExtraChoiceRequestSchema };
