import { describe, expect, it } from 'vitest';
import { aJellyfinEpisode } from './aJellyfinEpisode';

describe('aJellyfinEpisode', () => {
  it('is the first episode of Twin Peaks unless told otherwise', () => {
    expect(aJellyfinEpisode()).toMatchObject({ seriesTitle: 'Twin Peaks', seasonNumber: 1 });
    expect(aJellyfinEpisode({ episodeNumber: 4 }).episodeNumber).toBe(4);
  });
});
