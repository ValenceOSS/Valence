import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

/**
 * A party watching a film, with nobody in it and nothing held up, for a test to change what it needs.
 *
 * @param change - What differs.
 * @returns The party.
 */
const aWatchParty = (change: Partial<WatchParty> = {}): WatchParty => ({
  id: 'p-1',
  kind: 'watch',
  mediaId: 'film-1',
  createdAtMs: 0,
  everyoneMaySeek: true,
  everyoneMayPlayPause: true,
  hasPassword: false,
  isPlaying: true,
  isHeld: false,
  members: [],
  timekeeperId: null,
  ...change,
});

export { aWatchParty };
