import { describe, expect, it } from 'vitest';
import { describeEpisodeRun } from './describeEpisodeRun';

describe('describeEpisodeRun', () => {
  it('says one episode, or the first and last of a run', () => {
    expect(describeEpisodeRun([])).toBe('');
    expect(describeEpisodeRun([{ season: 1, episode: 13 }])).toBe('S01E13');
    expect(
      describeEpisodeRun([
        { season: 1, episode: 13 },
        { season: 1, episode: 24 },
      ]),
    ).toBe('S01E13 to S01E24');
  });
});
