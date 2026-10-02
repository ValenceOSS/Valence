import { describe, expect, it } from 'vitest';
import { drawnFromThisServer } from './drawnFromThisServer';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const ENTRY: CalendarEntry = {
  id: 'tv:300:s2e5',
  date: '2026-10-08',
  release: 'airs',
  title: 'A Show',
  episode: {
    seasonNumber: 2,
    episodeNumber: 5,
    title: 'Fifth',
    stillUrl: 'https://image.tmdb.org/t/p/w780/still.jpg',
  },
  artworkMediaId: null,
  posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
  backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
  logoUrl: null,
  state: 'notOutYet',
  source: 'request',
  requestedBy: null,
  opens: { kind: 'asking', requestKind: 'series', catalogueId: '300' },
};

describe('drawnFromThisServer', () => {
  it('serves every picture of the catalogue’s from this server', () => {
    expect(drawnFromThisServer(ENTRY)).toMatchObject({
      posterUrl: '/api/catalogue/pictures/w342/poster.jpg',
      backdropUrl: '/api/catalogue/pictures/w1280/backdrop.jpg',
      logoUrl: null,
      episode: { stillUrl: '/api/catalogue/pictures/w780/still.jpg' },
    });
  });

  it('leaves a film, which has no episode, without one', () => {
    expect(drawnFromThisServer({ ...ENTRY, episode: null }).episode).toBeNull();
  });
});
