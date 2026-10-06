import { describe, expect, it } from 'vitest';
import { createMemoryMusicPlays } from './createMemoryMusicPlays';

describe('createMemoryMusicPlays', () => {
  it('counts each song a profile heard since a time, with when it was last heard', async () => {
    let at = 1_000;
    const plays = createMemoryMusicPlays(() => at);

    await plays.record('pat', 'one');
    at = 2_000;
    await plays.record('pat', 'one');
    await plays.record('pat', 'two');

    await expect(plays.countsSince('pat', 0)).resolves.toEqual([
      { trackId: 'one', plays: 2, lastPlayedAtMs: 2_000 },
      { trackId: 'two', plays: 1, lastPlayedAtMs: 2_000 },
    ]);
  });

  it('leaves out what was heard before the time asked about', async () => {
    let at = 1_000;
    const plays = createMemoryMusicPlays(() => at);

    await plays.record('pat', 'old');
    at = 5_000;
    await plays.record('pat', 'new');

    await expect(plays.countsSince('pat', 2_000)).resolves.toEqual([
      { trackId: 'new', plays: 1, lastPlayedAtMs: 5_000 },
    ]);
  });

  it('keeps each profile’s hearing to itself', async () => {
    const plays = createMemoryMusicPlays(() => 1_000);

    await plays.record('pat', 'one');

    await expect(plays.countsSince('sam', 0)).resolves.toEqual([]);
  });
});
