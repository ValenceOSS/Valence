import { describe, expect, it } from 'vitest';
import { aJellyfinEpisode } from './aJellyfinEpisode';

describe('aJellyfinEpisode', () => {
  it('is the pilot of Twin Peaks with its media source unless told otherwise', () => {
    expect(aJellyfinEpisode()).toMatchObject({ Name: 'Pilot', SeriesName: 'Twin Peaks' });
    expect(aJellyfinEpisode().MediaSources?.[0]?.MediaStreams).toHaveLength(3);
    expect(aJellyfinEpisode({ Name: 'Coma' }).Name).toBe('Coma');
  });
});
