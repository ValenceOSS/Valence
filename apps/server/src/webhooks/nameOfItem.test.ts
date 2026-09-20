import { describe, expect, it } from 'vitest';
import { nameOfItem } from './nameOfItem';

const anEpisode = {
  title: 'The One With The Embargo',
  seriesTitle: 'Yes Minister',
  seasonNumber: 2,
  episodeNumber: 7,
  year: 1981,
};

describe('nameOfItem', () => {
  it('places an episode in its series, padded so a list of them lines up', () => {
    expect(nameOfItem(anEpisode)).toBe('Yes Minister S02E07 — The One With The Embargo');
  });

  it('keeps two digits for an episode past the ninety-ninth', () => {
    expect(nameOfItem({ ...anEpisode, seasonNumber: 12, episodeNumber: 104 })).toBe(
      'Yes Minister S12E104 — The One With The Embargo',
    );
  });

  it('names a film by its title and year', () => {
    expect(
      nameOfItem({
        title: 'Brazil',
        seriesTitle: null,
        seasonNumber: null,
        episodeNumber: null,
        year: 1985,
      }),
    ).toBe('Brazil (1985)');
  });

  it('leaves the brackets off something nothing dated', () => {
    expect(
      nameOfItem({
        title: 'Brazil',
        seriesTitle: null,
        seasonNumber: null,
        episodeNumber: null,
        year: null,
      }),
    ).toBe('Brazil');
  });

  it('falls back to the title where an episode is missing its place', () => {
    expect(nameOfItem({ ...anEpisode, episodeNumber: null })).toBe(
      'The One With The Embargo (1981)',
    );
  });
});
