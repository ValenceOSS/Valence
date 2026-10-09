import { describe, expect, it } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { isShowMissingEpisodes } from './isShowMissingEpisodes';

const TODAY = '2026-10-09';

const anEpisode = (episodeNumber: number, airDate: string) => ({
  episodeNumber,
  title: '',
  airDate,
});

describe('isShowMissingEpisodes', () => {
  it('finds an aired episode the library does not hold', () => {
    expect(
      isShowMissingEpisodes(
        {
          seasons: [{ seasonNumber: 1, episodes: [aMediaSummary()] }],
          shape: [
            {
              seasonNumber: 1,
              episodeCount: 2,
              episodes: [anEpisode(1, '2022-02-18'), anEpisode(2, '2022-02-25')],
            },
          ],
        },
        TODAY,
      ),
    ).toBe(true);
  });

  it('misses nothing still to air, nothing among the specials, and nothing where the shape is unknown', () => {
    expect(
      isShowMissingEpisodes(
        {
          seasons: [{ seasonNumber: 1, episodes: [aMediaSummary()] }],
          shape: [
            { seasonNumber: 0, episodeCount: 3, episodes: [] },
            {
              seasonNumber: 1,
              episodeCount: 2,
              episodes: [anEpisode(1, '2022-02-18'), anEpisode(2, '2027-01-01')],
            },
          ],
        },
        TODAY,
      ),
    ).toBe(false);
    expect(isShowMissingEpisodes({ seasons: [], shape: null }, TODAY)).toBe(false);
  });
});
