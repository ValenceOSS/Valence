import { describe, expect, it } from 'vitest';
import { calendarEntriesOfRequests } from './calendarEntriesOfRequests';
import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const anItem = (change: Partial<RequestItem>): RequestItem => ({
  id: '7f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'A Film',
  airDate: null,
  state: 'waiting',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...change,
});

const aRequest = (change: Partial<MediaRequest>): MediaRequest => ({
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  kind: 'film',
  tmdbId: 100,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'A Film',
  artistName: null,
  year: 2026,
  overview: null,
  posterUrl: 'https://image.example/poster.jpg',
  libraryId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'account-1', name: 'Sam' },
  seasons: null,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: '2026-10-10', digital: '2026-11-20', physical: '2027-01-05' },
  items: [anItem({})],
  mediaId: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...change,
});

describe('calendarEntriesOfRequests', () => {
  it('puts each of a film’s releases on its own day, within the days asked about', () => {
    const entries = calendarEntriesOfRequests([aRequest({})], '2026-10-01', '2026-12-31');

    expect(entries.map((entry) => [entry.date, entry.release])).toEqual([
      ['2026-10-10', 'cinema'],
      ['2026-11-20', 'digital'],
    ]);
    expect(entries[0]).toMatchObject({
      id: 'film:100:cinema',
      title: 'A Film',
      state: 'notOutYet',
      source: 'request',
      requestedBy: { id: 'account-1', name: 'Sam' },
      opens: { kind: 'asking', requestKind: 'film', catalogueId: '100' },
    });
  });

  it('opens a film that has arrived as the film', () => {
    const [entry] = calendarEntriesOfRequests(
      [aRequest({ mediaId: 'media-1', items: [anItem({ state: 'available' })] })],
      '2026-10-01',
      '2026-10-31',
    );

    expect(entry).toMatchObject({
      state: 'available',
      artworkMediaId: 'media-1',
      opens: { kind: 'item', mediaId: 'media-1' },
    });
  });

  it('puts each requested episode on the day it airs, with the catalogue’s still of it', () => {
    const entries = calendarEntriesOfRequests(
      [
        aRequest({
          kind: 'series',
          tmdbId: 200,
          title: 'A Show',
          releaseDates: { theatrical: null, digital: null, physical: null },
          items: [
            anItem({
              season: 2,
              episode: 1,
              title: 'Pilot',
              airDate: '2026-10-05',
              state: 'downloading',
            }),
            anItem({ season: 2, episode: 2, title: 'Second', airDate: '2026-10-12' }),
            anItem({ season: 2, episode: 3, title: 'Third', airDate: '2026-11-30' }),
            anItem({ season: 2, episode: 4, title: 'Undated' }),
          ],
        }),
      ],
      '2026-10-01',
      '2026-10-31',
      new Map([['tv:200:s2e1', 'https://image.example/pilot.jpg']]),
      new Map([['tv:200', { backdropUrl: '/backdrop.jpg', logoUrl: '/logo.png' }]]),
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: 'tv:200:s2e1',
      release: 'airs',
      title: 'A Show',
      backdropUrl: '/backdrop.jpg',
      logoUrl: '/logo.png',
      episode: {
        seasonNumber: 2,
        episodeNumber: 1,
        title: 'Pilot',
        stillUrl: 'https://image.example/pilot.jpg',
      },
      state: 'downloading',
      opens: { kind: 'asking', requestKind: 'series', catalogueId: '200' },
    });
    expect(entries[1]).toMatchObject({
      id: 'tv:200:s2e2',
      state: 'notOutYet',
      episode: { stillUrl: null },
    });
  });

  it('opens a series that has arrived as the show', () => {
    const [entry] = calendarEntriesOfRequests(
      [
        aRequest({
          kind: 'series',
          mediaId: 'series-1',
          items: [anItem({ season: 1, episode: 1, airDate: '2026-10-05' })],
        }),
      ],
      '2026-10-01',
      '2026-10-31',
    );

    expect(entry?.opens).toEqual({ kind: 'show', showId: 'series-1' });
  });

  it('shows nothing for a refused request, for music or books, or for a title it cannot open', () => {
    expect(
      calendarEntriesOfRequests(
        [
          aRequest({ approval: 'refused' }),
          aRequest({ kind: 'album', items: [anItem({ airDate: '2026-10-05' })] }),
          aRequest({ tmdbId: null }),
        ],
        '2026-10-01',
        '2026-12-31',
      ),
    ).toEqual([]);
  });
});
