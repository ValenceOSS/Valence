import { describe, expect, it } from 'vitest';
import { summaryOfRow } from './summaryOfRow';

const ROW = {
  id: 'matrix',
  libraryId: 'films',
  title: 'The Matrix',
  year: 1999,
  durationSeconds: 8160,
  width: 1920,
  height: 800,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: new Date('2026-10-01T00:00:00.000Z'),
  posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  artworkChangedAt: null,
  backdropUrl: null,
  logoUrl: 'https://image.tmdb.org/t/p/original/logo.png',
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  episodeNumberEnd: null,
  releaseDate: '1999-03-31',
  rating: 8.2,
  externalId: '603',
  genres: ['Action', 'Science Fiction'],
};

describe('turning a stored row into the summary a client lists it by', () => {
  it('says which pictures it has, keeps the poster and reads its genres', () => {
    expect(summaryOfRow(ROW)).toEqual({
      id: 'matrix',
      libraryId: 'films',
      title: 'The Matrix',
      year: 1999,
      durationSeconds: 8160,
      width: 1920,
      height: 800,
      videoCodec: 'hevc',
      videoRange: 'SDR',
      addedAt: '2026-10-01T00:00:00.000Z',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      hasPoster: true,
      hasBackdrop: false,
      hasLogo: true,
      seriesId: null,
      seriesTitle: null,
      seasonNumber: null,
      episodeNumber: null,
      episodeNumberEnd: null,
      releaseDate: '1999-03-31',
      rating: 8.2,
      externalId: '603',
      genres: ['Action', 'Science Fiction'],
    });
  });

  it('carries the revision of pictures that changed, and any column read beside the summary', () => {
    expect(
      summaryOfRow({
        ...ROW,
        artworkChangedAt: new Date(1000),
        genres: null,
        versionLabel: '4K',
      }),
    ).toMatchObject({ artworkRevision: 1000, genres: null, versionLabel: '4K' });
  });
});
