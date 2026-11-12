import { describe, expect, it } from 'vitest';
import { summaryOfRow } from './summaryOfRow';

const ROW = {
  id: 'matrix',
  libraryId: 'films',
  title: 'The Matrix',
  sortTitle: null,
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
  seriesSortTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  episodeNumberEnd: null,
  releaseDate: '1999-03-31',
  rating: 8.2,
  externalId: '603',
  genres: ['Action', 'Science Fiction'],
  audioStreams: [
    { codec: 'aac', channels: 2 },
    { codec: 'eac3', channels: 6, isDefault: true, isAtmos: true },
  ],
};

describe('turning a stored row into the summary a client lists it by', () => {
  it('says which pictures it has, keeps the poster and reads its genres', () => {
    expect(summaryOfRow(ROW)).toEqual({
      id: 'matrix',
      libraryId: 'films',
      title: 'The Matrix',
      sortTitle: null,
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
      seriesSortTitle: null,
      seasonNumber: null,
      episodeNumber: null,
      episodeNumberEnd: null,
      releaseDate: '1999-03-31',
      rating: 8.2,
      externalId: '603',
      genres: ['Action', 'Science Fiction'],
      audio: { codec: 'eac3', channels: 6, isAtmos: true },
    });
  });

  it('takes the first audio track when none is the default, and none from what it cannot read', () => {
    expect(summaryOfRow({ ...ROW, audioStreams: [{ codec: 'aac', channels: 2 }] }).audio).toEqual({
      codec: 'aac',
      channels: 2,
      isAtmos: false,
    });
    expect(summaryOfRow({ ...ROW, audioStreams: 'not streams' }).audio).toBeNull();
    expect(summaryOfRow({ ...ROW, audioStreams: [] }).audio).toBeNull();
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

  it('says where each picture it has is served by name, where the server names them', () => {
    expect(summaryOfRow(ROW, (url) => `/api/artwork/${url.length.toString()}`).artwork).toEqual({
      poster: '/api/artwork/42',
      logo: '/api/artwork/44',
    });
  });

  it('says nothing of names where the server does not name its pictures', () => {
    expect(summaryOfRow(ROW)).not.toHaveProperty('artwork');
  });
});
