import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which profiles on each account asked, for telling only them; an account that asked before
 * profiles were recorded is left out, so the whole account is told as it was then.
 *
 * @param askers - Who asked.
 * @returns The profiles that asked, by account.
 */
const askingProfilesOf = (askers: readonly Requester[]): ReadonlyMap<string, readonly string[]> => {
  const wholeAccounts = new Set(
    askers.filter((asker) => !asker.askingProfile).map((asker) => asker.id),
  );
  const profiles = new Map<string, string[]>();

  for (const asker of askers) {
    const profileId = asker.askingProfile?.profileId;

    if (profileId === undefined || wholeAccounts.has(asker.id)) {
      continue;
    }

    const known = profiles.get(asker.id) ?? [];

    profiles.set(asker.id, known.includes(profileId) ? known : [...known, profileId]);
  }

  return profiles;
};

export { askingProfilesOf };
