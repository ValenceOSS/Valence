import { z } from 'zod';
import { MAXIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MAXIMUM_USERNAME_LENGTH';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { MINIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MINIMUM_USERNAME_LENGTH';

const SETUP_LINK_LIFETIMES = [1, 7, 30] as const;

const SETUP_STATES = ['none', 'waiting', 'expired', 'used'] as const;

const DEFAULT_SETUP_LINK_LIFETIME = 7;

const SetupLinkLifetimeSchema = z.union([z.literal(1), z.literal(7), z.literal(30)]);

const SetupStateSchema = z.enum(SETUP_STATES);

const UsernameSchema = z
  .string()
  .trim()
  .min(MINIMUM_USERNAME_LENGTH)
  .max(MAXIMUM_USERNAME_LENGTH)
  .regex(/^[a-zA-Z0-9_.]+$/);

const IssuedSetupLinkSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string(),
});

const SetupLinkDetailsSchema = z.object({
  name: z.string(),
  username: z.string().nullable(),
  suggestedUsername: z.string(),
  hasEmail: z.boolean(),
  hasPassword: z.boolean(),
  canResetPassword: z.boolean().default(false),
  expiresAt: z.string(),
});

const SetupRedemptionSchema = z.object({
  username: UsernameSchema.optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(200).optional(),
});

type SetupLinkLifetime = z.infer<typeof SetupLinkLifetimeSchema>;
type SetupState = z.infer<typeof SetupStateSchema>;
type IssuedSetupLink = z.infer<typeof IssuedSetupLinkSchema>;
type SetupLinkDetails = z.infer<typeof SetupLinkDetailsSchema>;
type SetupRedemption = z.infer<typeof SetupRedemptionSchema>;

export type { IssuedSetupLink, SetupLinkDetails, SetupLinkLifetime, SetupRedemption, SetupState };

export {
  DEFAULT_SETUP_LINK_LIFETIME,
  IssuedSetupLinkSchema,
  SETUP_LINK_LIFETIMES,
  SETUP_STATES,
  SetupLinkDetailsSchema,
  SetupLinkLifetimeSchema,
  SetupRedemptionSchema,
  SetupStateSchema,
  UsernameSchema,
};
