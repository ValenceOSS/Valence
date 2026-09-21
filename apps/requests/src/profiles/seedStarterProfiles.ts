import { STARTER_PROFILES } from '@ValenceRequests/profiles/STARTER_PROFILES';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';

type SeedStarterProfilesOptions = {
  profiles: Pick<ProfileService, 'list' | 'add'>;
  wasSeeded: () => Promise<boolean>;
  remember: () => Promise<void>;
};

/**
 * Gives a server the quality profiles it should have had to begin with, the first time it starts.
 *
 * Requesting is unusable without one: a search has nothing to judge what it finds against, so the
 * first thing every operator had to do was write out five profiles that are the same on every
 * server. These are those five.
 *
 * Done once and recorded, rather than whenever the list is empty. An operator who deletes what they
 * do not want has said something, and putting it back on the next restart would be arguing with
 * them. A profile whose name is already taken is left alone for the same reason.
 *
 * @param profiles - The profiles, to read and to add to.
 * @param wasSeeded - Whether this has been done before.
 * @param remember - Records that it has been done.
 * @returns The names of the profiles added.
 */
const seedStarterProfiles = async ({
  profiles,
  wasSeeded,
  remember,
}: SeedStarterProfilesOptions): Promise<string[]> => {
  if (await wasSeeded()) {
    return [];
  }

  const taken = new Set((await profiles.list()).map((profile) => profile.name));
  const added: string[] = [];

  for (const draft of STARTER_PROFILES) {
    if (!taken.has(draft.name)) {
      await profiles.add(draft);
      added.push(draft.name);
    }
  }

  await remember();

  return added;
};

export { seedStarterProfiles };
