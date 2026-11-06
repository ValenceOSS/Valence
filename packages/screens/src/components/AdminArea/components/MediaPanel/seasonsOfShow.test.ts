import { describe, expect, it } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { seasonsOfShow } from './seasonsOfShow';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

const FIRST = aMediaSummary({
  id: '00000000-0000-4000-8000-000000000001',
  title: 'My name for it',
  seasonNumber: 1,
  episodeNumber: 1,
});

const DOUBLE = aMediaSummary({
  id: '00000000-0000-4000-8000-000000000002',
  title: 'Two at once',
  seasonNumber: 2,
  episodeNumber: 1,
  episodeNumberEnd: 2,
});

const SHOW: ShowDetail = {
  id: 'show',
  libraryId: '00000000-0000-4000-8000-0000000000aa',
  title: 'A programme',
  seasonCount: 2,
  episodeCount: 3,
  latestAddedAt: '2026-01-01T00:00:00.000Z',
  coverMediaId: FIRST.id,
  seriesId: null,
  seasons: [
    { seasonNumber: 1, episodes: [FIRST] },
    { seasonNumber: 2, episodes: [DOUBLE] },
  ],
  shape: [
    {
      seasonNumber: 1,
      episodeCount: 3,
      name: 'The beginning',
      episodes: [
        { episodeNumber: 1, title: 'Pilot', airDate: '2026-01-01' },
        { episodeNumber: 2, title: 'Second', airDate: '2026-02-01' },
        { episodeNumber: 3, title: 'Third', airDate: '2027-01-01' },
      ],
    },
  ],
};

describe('seasonsOfShow', () => {
  it('lists each catalogued episode as here, missing or not out yet, with its file', () => {
    const [first] = seasonsOfShow(SHOW, { [FIRST.id]: '/tv/Show/S01E01.mkv' }, '2026-11-04');

    expect(first).toMatchObject({ season: 1, name: 'The beginning' });
    expect(first?.episodes).toMatchObject([
      {
        episode: 1,
        title: 'My name for it',
        part: 'library',
        path: '/tv/Show/S01E01.mkv',
        mediaId: FIRST.id,
      },
      { episode: 2, title: 'Second', part: 'missing', mediaId: null },
      { episode: 3, title: 'Third', part: 'waiting', mediaId: null },
    ]);
  });

  it('lists a season the catalogue does not, from its files, a file of two episodes as both', () => {
    const [, second] = seasonsOfShow(SHOW, {}, '2026-11-04');

    expect(second).toMatchObject({ season: 2, name: null });
    expect(second?.episodes).toMatchObject([
      { episode: 1, title: 'Two at once', part: 'library', mediaId: DOUBLE.id },
      { episode: 2, title: '', part: 'library', mediaId: DOUBLE.id },
    ]);
  });
});
