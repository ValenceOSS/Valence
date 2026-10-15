import { z } from 'zod';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const PinSchema = z.string().regex(/^\d{4,8}$/u);

const ChooseProfileSchema = z.object({
  pin: z.string().max(64).optional(),
  newPin: PinSchema.optional(),
});

const ProfilePinChangeSchema = z.object({ pin: PinSchema.nullable() });

const ProfileChoiceRefusalSchema = RefusalSchema.extend({
  needs: z.enum(['pin', 'newPin']).optional(),
});

type ChooseProfile = z.infer<typeof ChooseProfileSchema>;
type ProfileChoiceRefusal = z.infer<typeof ProfileChoiceRefusalSchema>;

export type { ChooseProfile, ProfileChoiceRefusal };

export { ChooseProfileSchema, PinSchema, ProfileChoiceRefusalSchema, ProfilePinChangeSchema };
