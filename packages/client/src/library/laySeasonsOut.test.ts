import { describe, expect, it } from 'vitest';
import { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

const episode = (seasonNumber: number, episodeNumber: number): MediaSummary => ({
  id: `${seasonNumber.toString()}-${episodeNumber.toString()}`,
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: `Episode ${episodeNumber.toString()}`,
  year: 2024,
  durationSeconds: 1400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'A Sign of Affection',
  seasonNumber,
  episodeNumber,
});

const show = (seasons: { seasonNumber: number; episodes: number[] }[]): ShowDetail => ({
  id: 'a-sign-of-affection',
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: 'A Sign of Affection',
  seasonCount: seasons.length,
  episodeCount: seasons.reduce((count, season) => count + season.episodes.length, 0),
  latestAddedAt: '2026-08-10T00:00:00.000Z',
  coverMediaId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  seriesId: null,
  year: 2024,
  rating: 8.1,
  genres: [],
  seasons: seasons.map((season) => ({
    seasonNumber: season.seasonNumber,
    episodes: season.episodes.map((number) => episode(season.seasonNumber, number)),
  })),
});

const TODAY = '2026-09-22';

describe('laySeasonsOut', () => {
  it('shows the first season where none was chosen', () => {
    const laid = laySeasonsOut(
      show([
        { seasonNumber: 1, episodes: [1, 2] },
        { seasonNumber: 2, episodes: [1] },
      ]),
      null,
      TODAY,
    );

    expect(laid.showing).toBe(1);
    expect(laid.rows.map((row) => row.at)).toEqual([1, 2]);
  });

  it('puts a missing episode where it falls, between the ones that are here', () => {
    const laid = laySeasonsOut(show([{ seasonNumber: 1, episodes: [1, 3] }]), 1, TODAY);

    expect(laid.rows.map((row) => [row.at, row.episode === null])).toEqual([
      [1, false],
      [2, true],
      [3, false],
    ]);
  });

  it('offers a season the catalogue says is missing, with the episodes it lists', () => {
    const laid = laySeasonsOut(
      {
        ...show([{ seasonNumber: 1, episodes: [1] }]),
        shape: [
          { seasonNumber: 1, episodeCount: 1, episodes: [] },
          {
            seasonNumber: 2,
            episodeCount: 1,
            episodes: [{ episodeNumber: 1, title: 'Return', airDate: '2026-09-29' }],
          },
        ],
      },
      2,
      TODAY,
    );

    expect(laid.choices).toEqual([
      { seasonNumber: 1, isHeld: true },
      { seasonNumber: 2, isHeld: false },
    ]);
    expect(laid.rows[0]?.listed?.title).toBe('Return');
    expect(laid.rows[0]?.airs).not.toBe('');
  });
});
