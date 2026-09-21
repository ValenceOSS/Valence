import { STARTER_PROFILES } from '@ValenceRequests/profiles/STARTER_PROFILES';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';

type SeedStarterProfilesOptions = {
  profiles: Pick<ProfileService, 'list' | 'add'>;
  seeded: () => Promise<string[]>;
  remember: (names: readonly string[]) => Promise<void>;
};

/**
 * Gives a server the quality profiles it should have had to begin with.
 *
 * Requesting is unusable without one: a search has nothing to judge what it finds against, so the
 * first thing every operator had to do was write out the same handful by hand.
 *
 * Which have been seeded is recorded by name rather than as one flag for the lot, so a starter
 * profile added to a later version reaches servers that were set up before it existed — which is
 * the only reason the music ones reach anybody who installed Valence before they were written. A
 * name is recorded whether or not it was added, so a profile an operator deletes stays deleted and
 * one whose name they had already taken is left alone.
 *
 * @param profiles - The profiles, to read and to add to.
 * @param seeded - The names seeded on this server before now.
 * @param remember - Records the names that have now been seen.
 * @returns The names of the profiles added.
 */
const seedStarterProfiles = async ({
  profiles,
  seeded,
  remember,
}: SeedStarterProfilesOptions): Promise<string[]> => {
  const already = new Set(await seeded());
  const wanted = STARTER_PROFILES.filter((draft) => !already.has(draft.name));

  if (wanted.length === 0) {
    return [];
  }

  const taken = new Set((await profiles.list()).map((profile) => profile.name));
  const added: string[] = [];

  for (const draft of wanted) {
    if (!taken.has(draft.name)) {
      await profiles.add(draft);
      added.push(draft.name);
    }
  }

  await remember([...already, ...wanted.map((draft) => draft.name)]);

  return added;
};

export { seedStarterProfiles };
