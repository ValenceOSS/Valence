import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { ProfileChoiceRefusalSchema } from '@ValenceContracts/schemas/ProfilePin';
import { ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { say } from '@ValenceI18n/say';

type ProfileChoice =
  | { kind: 'chosen'; profile: ViewerProfile }
  | { kind: 'needsPin'; reason: string | null }
  | { kind: 'needsNewPin'; reason: string }
  | { kind: 'waiting'; reason: string }
  | { kind: 'refused'; reason: string };

/**
 * Chooses who is watching on this device, with the profile's PIN where it has one, a new PIN where
 * the owner must choose one, or the account's password and a new PIN where somebody forgot theirs.
 *
 * @param profileId - Who is watching.
 * @param proof - The PIN, a new PIN, or the password, as the profile needs.
 * @param proof.pin - The profile's PIN.
 * @param proof.newPin - A PIN to set as it is chosen.
 * @param proof.password - The account's password, to set a forgotten PIN again.
 * @returns What came of it.
 */
const chooseProfile = async (
  profileId: string,
  proof: { pin?: string; newPin?: string; password?: string } = {},
): Promise<ProfileChoice> => {
  const response = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/choose`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(proof),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', reason: say('common.valenceCouldNotBeReached') };
  }

  const body = await response
    .json()
    .then((value) => JsonValueSchema.parse(value))
    .catch(() => null);

  if (response.ok) {
    const profile = ViewerProfileSchema.safeParse(body);

    return profile.success
      ? { kind: 'chosen', profile: profile.data }
      : { kind: 'refused', reason: say('client.admin.readRefusal.thatCouldNotBeDoneTry') };
  }

  const refusal = ProfileChoiceRefusalSchema.safeParse(body);
  const reason = refusal.success
    ? refusal.data.error
    : say('client.admin.readRefusal.thatCouldNotBeDoneTry');

  if (response.status === 429) {
    return { kind: 'waiting', reason };
  }

  if (refusal.success && refusal.data.needs === 'newPin') {
    return { kind: 'needsNewPin', reason };
  }

  if (refusal.success && refusal.data.needs === 'pin') {
    return {
      kind: 'needsPin',
      reason: proof.pin === undefined && proof.password === undefined ? null : reason,
    };
  }

  return { kind: 'refused', reason };
};

export type { ProfileChoice };

export { chooseProfile };
