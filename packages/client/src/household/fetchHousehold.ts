import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { HouseholdSchema, OnboardingSchema } from '@ValenceContracts/schemas/Household';
import type { Household, HouseholdRequest, Onboarding } from '@ValenceContracts/schemas/Household';
import { say } from '@ValenceI18n/say';

const RefusalSchema = z.object({ error: z.string() });

/**
 * The household, and whether anybody has finished setting it up.
 *
 * @returns What the household is, and whether it is set up.
 */
const fetchOnboarding = async (): Promise<Onboarding> =>
  readFromServer('/api/account/onboarding', OnboardingSchema);

/**
 * Changes what the household is called, or what it is drawn with.
 *
 * @param request - What to change, which may be any one thing on its own.
 * @returns The household as it now stands, or null where the change was refused.
 */
const saveHousehold = async (request: HouseholdRequest): Promise<Household | null> => {
  const response = await fetch('/api/account', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return HouseholdSchema.parse(await response.json());
};

/**
 * Puts a picture on the household.
 *
 * @param file - The picture somebody chose.
 * @returns What was wrong with it, or null where it was kept.
 */
const uploadHouseholdPhoto = async (file: File): Promise<string | null> => {
  const response = await fetch('/api/account/photo', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': file.type },
    body: file,
  }).catch(() => null);

  if (response === null) {
    return say('client.fetchHousehold.couldNotSend');
  }

  if (response.ok) {
    return null;
  }

  const said = RefusalSchema.safeParse(await response.json().catch(() => null));

  return said.success ? said.data.error : say('client.fetchHousehold.couldNotUse');
};

/**
 * Says that this household has been set up, which is the thing that stops it being asked again.
 *
 * Its own call rather than a field on the change above, so that finishing is something that happens
 * at the end of a flow rather than a value anybody can claim on the way into one.
 *
 * @returns Whether it was recorded.
 */
const finishOnboarding = async (): Promise<boolean> => {
  const response = await fetch('/api/account/onboarding', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

export { fetchOnboarding, saveHousehold, uploadHouseholdPhoto, finishOnboarding };
