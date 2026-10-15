import type { ProfileCeiling, ProfileLimits } from './ProfileLimits';

/**
 * What an account's owner has narrowed each profile to, held in memory for tests and for a server
 * running without a database.
 *
 * @returns The limits.
 */
const createMemoryProfileLimits = (): ProfileLimits => {
  const refused = new Map<string, Set<string>>();
  const ceilings = new Map<string, Map<string, ProfileCeiling>>();

  const refusedOf = (profileId: string): Set<string> => {
    const held = refused.get(profileId) ?? new Set<string>();

    refused.set(profileId, held);

    return held;
  };

  const ceilingsOf = (profileId: string): Map<string, ProfileCeiling> => {
    const held = ceilings.get(profileId) ?? new Map<string, ProfileCeiling>();

    ceilings.set(profileId, held);

    return held;
  };

  return {
    refusedLibraries: (profileId) => Promise.resolve([...refusedOf(profileId)]),
    ceilingsFor: (profileId) => Promise.resolve([...ceilingsOf(profileId).values()]),
    refuseLibrary: (profileId, libraryId) => {
      refusedOf(profileId).add(libraryId);

      return Promise.resolve();
    },
    allowLibrary: (profileId, libraryId) => {
      refusedOf(profileId).delete(libraryId);

      return Promise.resolve();
    },
    setCeiling: (profileId, ceiling) => {
      ceilingsOf(profileId).set(ceiling.libraryId, ceiling);

      return Promise.resolve();
    },
    clearCeiling: (profileId, libraryId) => {
      ceilingsOf(profileId).delete(libraryId);

      return Promise.resolve();
    },
  };
};

export { createMemoryProfileLimits };
