import { describe, expect, it } from 'vitest';
import { nameTheNextEpisode } from './nameTheNextEpisode';

describe('nameTheNextEpisode', () => {
  it('names an episode by its place and its title', () => {
    expect(nameTheNextEpisode({ title: 'Pilot', seasonNumber: 1, episodeNumber: 4 })).toBe(
      'S1 E4 · Pilot',
    );
  });

  it('names a double episode by both its numbers', () => {
    expect(
      nameTheNextEpisode({
        title: 'Pilot',
        seasonNumber: 2,
        episodeNumber: 1,
        episodeNumberEnd: 2,
      }),
    ).toBe('S2 E1–2 · Pilot');
  });

  it('names an episode with no known place by its title', () => {
    expect(nameTheNextEpisode({ title: 'Pilot', seasonNumber: null, episodeNumber: 3 })).toBe(
      'Pilot',
    );
  });
});
