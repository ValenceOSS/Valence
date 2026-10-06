import type { MusicPlays } from './MusicPlays';

/**
 * The songs each profile has heard, held in memory, for a server run without a database and for
 * tests.
 *
 * @param now - The clock a hearing is stamped with.
 * @returns The record of hearings.
 */
const createMemoryMusicPlays = (now: () => number = Date.now): MusicPlays => {
  const heard: { profileId: string; trackId: string; atMs: number }[] = [];

  return {
    record: (profileId, trackId) => {
      heard.push({ profileId, trackId, atMs: now() });

      return Promise.resolve();
    },

    countsSince: (profileId, sinceMs) => {
      const counts = new Map<string, { plays: number; lastPlayedAtMs: number }>();

      for (const one of heard) {
        if (one.profileId === profileId && one.atMs >= sinceMs) {
          const was = counts.get(one.trackId) ?? { plays: 0, lastPlayedAtMs: 0 };

          counts.set(one.trackId, {
            plays: was.plays + 1,
            lastPlayedAtMs: Math.max(was.lastPlayedAtMs, one.atMs),
          });
        }
      }

      return Promise.resolve([...counts].map(([trackId, count]) => ({ trackId, ...count })));
    },
  };
};

export { createMemoryMusicPlays };
