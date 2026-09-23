import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  approveMediaRequest,
  askForMedia,
  changeMediaRequest,
  fetchMediaRequestLog,
  fetchMediaRequestReleases,
  fetchMediaRequests,
  fetchSeriesSeasons,
  searchMusicCatalogue,
  findReleasesFor,
  pickMediaRelease,
  refuseMediaRequest,
  removeMediaRequest,
  retryMediaRequest,
  fulfilMediaRequest,
  searchMissing,
} from './fetchMediaRequests';

const REQUEST = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  kind: 'film',
  tmdbId: 438631,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'Dune',
  artistName: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  libraryId: 'films',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'someone', name: 'Someone' },
  seasons: null,
  releaseTypes: null,
  releaseDate: '2021-12-03',
  items: [],
  mediaId: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const RELEASE = {
  id: 'x',
  title: 'Dune.2021.1080p.WEB-DL',
  indexerId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  indexerName: 'Jackett',
  protocol: 'torrent' as const,
  sizeBytes: null,
  seeders: 1,
  leechers: 0,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: 'magnet:?xt=urn:btih:abc',
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMediaRequests', () => {
  it('reads the requests', async () => {
    answering([REQUEST]);

    expect(await fetchMediaRequests()).toEqual([REQUEST]);
  });

  it('asks, changes, approves, refuses, retries and picks, reading each answer as a request', async () => {
    const asked = answering(REQUEST);

    for (const sending of [
      askForMedia({ kind: 'film', tmdbId: 438631 }),
      changeMediaRequest(REQUEST.id, { isPickedByHand: true }),
      approveMediaRequest(REQUEST.id),
      refuseMediaRequest(REQUEST.id, 'No room'),
      retryMediaRequest(REQUEST.id),
      fulfilMediaRequest(REQUEST.id),
      pickMediaRelease(REQUEST.id, RELEASE),
    ]) {
      expect((await sending).value).toEqual(REQUEST);
    }

    expect(asked.mock.calls.map(([path, init]) => `${init?.method ?? 'GET'} ${path}`)).toEqual([
      'POST /api/requests/media',
      `PATCH /api/requests/media/${REQUEST.id}`,
      `POST /api/requests/media/${REQUEST.id}/approve`,
      `POST /api/requests/media/${REQUEST.id}/refuse`,
      `POST /api/requests/media/${REQUEST.id}/retry`,
      `POST /api/requests/media/${REQUEST.id}/fulfil`,
      `POST /api/requests/media/${REQUEST.id}/pick`,
    ]);
  });

  it('reads the seasons a series has, and where each stands', async () => {
    const asked = answering([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'library' },
      { season: 2, episodeCount: 10, firstAired: null },
    ]);

    expect(await fetchSeriesSeasons(95396)).toEqual([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'library' },
      { season: 2, episodeCount: 10, firstAired: null, standing: 'askable' },
    ]);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/requests/catalogue/series/95396/seasons');
  });

  it('searches MusicBrainz for an artist or an album', async () => {
    const found = [
      {
        kind: 'album',
        musicBrainzId: 'f5093c06-23e3-404f-aeaa-40f72885ee3a',
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        disambiguation: null,
        type: 'album',
        year: 1973,
        coverUrl: null,
      },
    ];
    const asked = answering(found);

    expect(await searchMusicCatalogue('dark side & moon', 'album')).toEqual(found);
    expect(asked.mock.calls[0]?.[0]).toBe(
      '/api/requests/catalogue/music?query=dark+side+%26+moon&kind=album',
    );
  });

  it('reads what a request has done', async () => {
    const said = [
      { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched for it.', problemCode: null },
    ];
    const asked = answering(said);

    expect(await fetchMediaRequestLog(REQUEST.id)).toEqual(said);
    expect(asked.mock.calls[0]?.[0]).toBe(`/api/requests/media/${REQUEST.id}/log`);
  });

  it('searches for a request by hand, and for everything missing', async () => {
    const outcome = { releases: [], indexers: [], judgements: [], pickedId: null };

    const asked = answering(outcome);

    expect(await fetchMediaRequestReleases(REQUEST.id)).toEqual(outcome);
    expect((await findReleasesFor({ kind: 'film', tmdbId: 438631 })).value).toEqual(outcome);
    expect(asked.mock.calls[1]?.[0]).toBe('/api/requests/media/releases');

    answering({ searched: 2, startedAt: '2026-09-19T00:00:00.000Z' });

    expect((await searchMissing()).value).toEqual({
      searched: 2,
      startedAt: '2026-09-19T00:00:00.000Z',
    });
  });

  it('removes a request, and says why where it would not', async () => {
    answering(null, 204);

    expect(await removeMediaRequest(REQUEST.id)).toBeNull();

    answering({ error: 'Not yours' }, 403);

    expect(await removeMediaRequest(REQUEST.id)).toEqual({ message: 'Not yours' });
  });

  it('cancels a request, deleting what it had started downloading', async () => {
    const asked = answering(null, 204);

    expect(await removeMediaRequest(REQUEST.id, true)).toBeNull();
    expect(asked.mock.calls[0]?.[0]).toBe(`/api/requests/media/${REQUEST.id}?deleteDownloads=true`);
  });
});
