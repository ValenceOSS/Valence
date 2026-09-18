import { z } from 'zod';
import { AvatarSchema, ProfileColourSchema } from './ViewerProfile';

const NAME_MAX = 40;

const HouseholdSchema = z.object({
  name: z.string().min(1).max(NAME_MAX),
  colour: ProfileColourSchema,
  avatar: AvatarSchema,
  updatedAt: z.string(),
});

const HouseholdRequestSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX).optional(),
  colour: ProfileColourSchema.optional(),
  avatar: AvatarSchema.optional(),
});

const OnboardingSchema = z.object({
  isOnboarded: z.boolean(),
  household: HouseholdSchema,
});

/**
 * Builds the address a household's picture is served from, carrying the row's own last-changed time
 * so that changing the picture changes the address.
 *
 * The same reasoning as a profile's, and for the same reason: without it a browser shows the old
 * picture until its cache expires, which is long after somebody changed it and went looking.
 *
 * @param household - The household being drawn, with the time it was last changed.
 * @returns The address to load the picture from.
 */
const householdAvatarUrl = (household: { updatedAt: string }): string =>
  `/api/account/avatar?v=${encodeURIComponent(household.updatedAt)}`;

/**
 * Builds the address another account's household picture is served from, for an administrator
 * looking at somebody else's.
 *
 * A separate address rather than an identifier on the one above, because a household is reached
 * through whoever is signed in and there is nothing on the row to address it by. Reading somebody
 * else's is an administrator's act and goes through an administrator's route.
 *
 * @param accountId - The account whose picture to draw.
 * @param household - Its household, with the time it was last changed.
 * @returns The address to load the picture from.
 */
const accountAvatarUrl = (accountId: string, household: { updatedAt: string }): string =>
  `/api/admin/accounts/${encodeURIComponent(accountId)}/avatar?v=${encodeURIComponent(household.updatedAt)}`;

type Household = z.infer<typeof HouseholdSchema>;
type HouseholdRequest = z.infer<typeof HouseholdRequestSchema>;
type Onboarding = z.infer<typeof OnboardingSchema>;

export type { Household, HouseholdRequest, Onboarding };

export {
  HouseholdSchema,
  HouseholdRequestSchema,
  OnboardingSchema,
  NAME_MAX,
  householdAvatarUrl,
  accountAvatarUrl,
};
