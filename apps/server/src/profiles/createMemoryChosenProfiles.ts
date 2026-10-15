import type { ChosenProfiles } from './ChosenProfiles';

/**
 * Which profile each session and API key acts as, held in memory for tests and for a server running
 * without a database.
 *
 * @returns The chosen profiles.
 */
const createMemoryChosenProfiles = (): ChosenProfiles => {
  const sessions = new Map<string, string>();
  const keys = new Map<string, string>();

  return {
    chosenFor: (sessionId) => Promise.resolve(sessions.get(sessionId) ?? null),
    choose: (sessionId, profileId) => {
      sessions.set(sessionId, profileId);

      return Promise.resolve();
    },
    forget: (sessionId) => {
      sessions.delete(sessionId);

      return Promise.resolve();
    },
    keyProfileOf: (keyId) => Promise.resolve(keys.get(keyId) ?? null),
    tieKey: (keyId, profileId) => {
      keys.set(keyId, profileId);

      return Promise.resolve();
    },
  };
};

export { createMemoryChosenProfiles };
