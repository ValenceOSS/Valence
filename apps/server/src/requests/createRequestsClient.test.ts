import { describe, expect, it, vi } from 'vitest';
import { createRequestsClient } from './createRequestsClient';
import type { DownloadStreamFrame } from '@ValenceContracts/schemas/DownloadQueue';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

const A_STATUS = {
  version: '0.4.0',
  vpn: {
    isConfigured: false,
    isUp: null,
    publicAddress: null,
    country: null,
    checkedAt: null,
    problem: null,
  },
  indexers: { total: 0, enabled: 0, failing: [] },
};

/**
 * The service, answering the one way asked.
 */
const answering = (status: number, body: object) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('createRequestsClient', () => {
  it('reads what the service says about itself, presenting the secret', async () => {
    const fetch = answering(200, A_STATUS);
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch,
    });

    expect(await client.readStatus()).toEqual({ kind: 'answered', status: A_STATUS });
    expect(fetch).toHaveBeenCalledWith(
      'http://requests:8421/api/status',
      expect.objectContaining({ headers: { Authorization: `Bearer ${A_SECRET}` } }),
    );
  });

  it('says when the secrets do not match', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(401, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 refused the secret; REQUESTS_SECRET must be the same on both',
    });
  });

  it('says what any other failure answered', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(502, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered 502',
    });
  });

  it('says when something else is answering at that address', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(200, { hello: 'world' }),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered, but not as the requests service',
    });
  });

  it('says when nothing answers at all', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: () => Promise.reject(new Error('connect ECONNREFUSED')),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 did not answer',
    });
  });

  describe('indexers and searching', () => {
    const AN_INDEXER = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      name: 'Jackett',
      kind: 'torznab',
      url: 'http://jackett:9117/',
      hasApiKey: true,
      definitionId: null,
      settings: {},
      secretsSet: [],
      privacy: null,
      removesWhenDone: null,
      seedSeconds: null,
      seedRatio: null,
      priority: 25,
      isEnabled: true,
      categories: [],
      requestsPerMinute: null,
      timeoutSeconds: 30,
      capabilities: null,
      failures: 0,
      lastProblem: null,
      lastFailedAt: null,
      turnedOffBecause: null,
      createdAt: '2026-09-19T00:00:00.000Z',
      updatedAt: '2026-09-19T00:00:00.000Z',
    };

    const A_TEST = { isWorking: true, problem: null, capabilities: null, captcha: null };

    const A_DRAFT = { name: 'Jackett', kind: 'torznab' as const, url: 'http://jackett:9117/' };

    /**
     * A client over a service that answers the one way.
     */
    const aClient = (status: number, body: object | null) => {
      const fetch = vi.fn(() =>
        Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
      );

      return {
        fetch,
        client: createRequestsClient({ address: 'http://requests:8421', secret: A_SECRET, fetch }),
      };
    };

    it('lists the indexers', async () => {
      const { client, fetch } = aClient(200, [AN_INDEXER]);

      expect(await client.listIndexers()).toEqual({ kind: 'answered', value: [AN_INDEXER] });
      expect(fetch).toHaveBeenCalledWith(
        'http://requests:8421/api/indexers',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('adds one, sending what to add', async () => {
      const { client, fetch } = aClient(201, AN_INDEXER);

      expect(await client.addIndexer(A_DRAFT)).toEqual({ kind: 'answered', value: AN_INDEXER });
      expect(fetch).toHaveBeenCalledWith(
        'http://requests:8421/api/indexers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(A_DRAFT),
          headers: { Authorization: `Bearer ${A_SECRET}`, 'content-type': 'application/json' },
        }),
      );
    });

    it('changes one', async () => {
      const { client, fetch } = aClient(200, AN_INDEXER);

      expect((await client.changeIndexer(AN_INDEXER.id, { priority: 3 })).kind).toBe('answered');
      expect(fetch).toHaveBeenCalledWith(
        `http://requests:8421/api/indexers/${AN_INDEXER.id}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('removes one', async () => {
      const { client } = aClient(204, null);

      expect(await client.removeIndexer(AN_INDEXER.id)).toEqual({ kind: 'answered', value: null });
    });

    it('tests one that is kept, and tries one that is not yet', async () => {
      const { client, fetch } = aClient(200, A_TEST);

      expect(await client.testIndexer(AN_INDEXER.id)).toEqual({ kind: 'answered', value: A_TEST });
      expect(await client.tryIndexer(A_DRAFT)).toEqual({ kind: 'answered', value: A_TEST });
      expect(await client.tryIndexer(A_DRAFT, AN_INDEXER.id)).toEqual({
        kind: 'answered',
        value: A_TEST,
      });
      expect(fetch.mock.calls.map((call) => String(call.at(0)))).toEqual([
        `http://requests:8421/api/indexers/${AN_INDEXER.id}/test`,
        'http://requests:8421/api/indexers/try',
        `http://requests:8421/api/indexers/${AN_INDEXER.id}/try`,
      ]);
    });

    it('searches', async () => {
      const { client } = aClient(200, { releases: [], indexers: [] });

      expect(await client.search({ query: 'dune' })).toEqual({
        kind: 'answered',
        value: { releases: [], indexers: [], judgements: [], pickedId: null },
      });
    });

    it('passes on what the service said when it refused', async () => {
      const { client } = aClient(404, { error: 'No such indexer.' });

      expect(await client.testIndexer(AN_INDEXER.id)).toEqual({
        kind: 'refused',
        status: 404,
        error: 'No such indexer.',
      });
    });

    it('still says it refused where the service gave no reason', async () => {
      const { client } = aClient(400, null);

      expect(await client.addIndexer(A_DRAFT)).toEqual({
        kind: 'refused',
        status: 400,
        error: 'The requests service refused that.',
      });
    });

    it('says the service is silent where it could not be heard', async () => {
      const { client } = aClient(503, {});

      expect(await client.listIndexers()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 answered 503',
      });
    });

    it('says a status that was refused is a silent one', async () => {
      const { client } = aClient(404, { error: 'Not here.' });

      expect(await client.readStatus()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 refused to say how it is',
      });
    });

    it('says something answered that was not the service, where it answered something else', async () => {
      const fetch = vi.fn(() => Promise.resolve(new Response('<html>', { status: 200 })));
      const client = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch,
      });

      expect(await client.listIndexers()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 answered, but not as the requests service',
      });
    });

    it('reads the catalogue, refreshes it, and describes one definition', async () => {
      const catalogue = {
        definitions: [],
        updatedAt: null,
        source: 'Prowlarr/Indexers@master/definitions/v11',
        problem: null,
      };
      const { client, fetch } = aClient(200, catalogue);

      expect(await client.catalogue()).toEqual({ kind: 'answered', value: catalogue });
      expect(await client.refreshCatalogue()).toEqual({ kind: 'answered', value: catalogue });
      expect(fetch.mock.calls.map((call) => String(call.at(0)))).toEqual([
        'http://requests:8421/api/definitions',
        'http://requests:8421/api/definitions/refresh',
      ]);

      const detail = {
        id: '1337x',
        name: '1337x',
        description: '',
        language: 'en-US',
        privacy: 'public',
        protocol: 'torrent',
        categories: [],
        links: ['https://1337x.to/'],
        settings: [],
        standardCategories: [],
        hasCaptcha: false,
        isBehindCloudflare: true,
      };

      expect(await aClient(200, detail).client.definition('1337x')).toEqual({
        kind: 'answered',
        value: detail,
      });
    });

    it('fetches a release as a file, or as a magnet link', async () => {
      const fileFetch = vi.fn<(url: string, init: { body?: string }) => Promise<Response>>(() =>
        Promise.resolve(
          new Response(new Uint8Array([0x64]), {
            headers: { 'content-type': 'application/x-bittorrent' },
          }),
        ),
      );
      const file = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: fileFetch,
      });

      expect(await file.download(AN_INDEXER.id, 'https://x/1')).toEqual({
        kind: 'answered',
        value: {
          kind: 'file',
          bytes: new Uint8Array([0x64]),
          contentType: 'application/x-bittorrent',
        },
      });
      expect(JSON.parse(String(fileFetch.mock.calls.at(0)?.[1].body))).toEqual({
        url: 'https://x/1',
      });

      const magnet = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: () =>
          Promise.resolve(
            new Response(JSON.stringify({ magnet: 'magnet:?xt=urn:btih:A' }), {
              headers: { 'content-type': 'application/json' },
            }),
          ),
      });

      expect(await magnet.download(AN_INDEXER.id, 'x')).toEqual({
        kind: 'answered',
        value: { kind: 'magnet', url: 'magnet:?xt=urn:btih:A' },
      });
    });

    it('passes on why a release could not be fetched', async () => {
      expect(
        await aClient(404, { error: 'No such indexer.' }).client.download(AN_INDEXER.id, 'x'),
      ).toEqual({
        kind: 'refused',
        status: 404,
        error: 'No such indexer.',
      });
      expect(
        await aClient(502, { error: 'The site answered 410' }).client.download(AN_INDEXER.id, 'x'),
      ).toEqual({
        kind: 'silent',
        reason: 'The site answered 410',
      });
      expect(await aClient(500, null).client.download(AN_INDEXER.id, 'x')).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 answered 500',
      });

      const offline = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: () => Promise.reject(new TypeError('offline')),
      });

      expect(await offline.download(AN_INDEXER.id, 'x')).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 did not answer',
      });
    });
  });
});

describe('createRequestsClient with download clients', () => {
  const A_CLIENT = {
    id: '0f8fad5b-d9cb-469f-a165-70867728950e',
    name: 'qBittorrent',
    kind: 'qbittorrent' as const,
    url: 'http://qbittorrent:8080',
    username: 'admin',
    hasPassword: true,
    hasApiKey: false,
    remotePath: '',
    localPath: '',
    categories: {
      movies: 'valence-films',
      shows: 'valence-series',
      music: 'valence-music',
      books: 'valence-books',
    },
    priority: 25,
    isEnabled: true,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  };

  const A_DOWNLOAD = {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    clientId: A_CLIENT.id,
    clientName: 'qBittorrent',
    protocol: 'torrent' as const,
    libraryKind: 'movies' as const,
    title: 'Dune',
    indexerName: null,
    state: 'queued' as const,
    problem: null,
    progress: 0,
    sizeBytes: null,
    doneBytes: null,
    downloadBytesPerSecond: null,
    uploadBytesPerSecond: null,
    secondsLeft: null,
    seeds: null,
    peers: null,
    sentAt: '2026-09-19T00:00:00.000Z',
    finishedAt: null,
    filedInto: null,
    filingProblem: null,
  };

  const A_QUEUE = { clients: [], downloads: [A_DOWNLOAD], checkedAt: null };

  const A_TEST = { isWorking: true, problem: null, version: 'v5.0.1' };

  const A_DRAFT = {
    name: 'qBittorrent',
    kind: 'qbittorrent' as const,
    url: 'http://qbittorrent:8080',
  };

  /**
   * A client over a service that answers every call the one way.
   */
  const aClient = (status: number, body: object | null) => {
    const fetch = vi.fn((url: string, init: { method?: string }) => {
      void url;
      void init;

      return Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status }));
    });

    return {
      fetch,
      client: createRequestsClient({ address: 'http://requests:8421', secret: A_SECRET, fetch }),
    };
  };

  /**
   * Where each call went, and how.
   */
  const addressed = (fetch: ReturnType<typeof aClient>['fetch']) =>
    fetch.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url}`);

  it('keeps, changes, tests and removes download clients', async () => {
    const listing = aClient(200, [A_CLIENT]);

    expect(await listing.client.listClients()).toEqual({ kind: 'answered', value: [A_CLIENT] });

    const keeping = aClient(201, A_CLIENT);

    expect((await keeping.client.addClient(A_DRAFT)).kind).toBe('answered');
    expect((await keeping.client.changeClient(A_CLIENT.id, { priority: 3 })).kind).toBe('answered');

    const testing = aClient(200, A_TEST);

    expect(await testing.client.testClient(A_CLIENT.id)).toEqual({
      kind: 'answered',
      value: A_TEST,
    });
    expect((await testing.client.tryClient(A_DRAFT)).kind).toBe('answered');
    expect((await testing.client.tryClient(A_DRAFT, A_CLIENT.id)).kind).toBe('answered');

    const removing = aClient(204, null);

    expect(await removing.client.removeClient(A_CLIENT.id)).toEqual({
      kind: 'answered',
      value: null,
    });
    expect([
      ...addressed(keeping.fetch),
      ...addressed(testing.fetch),
      ...addressed(removing.fetch),
    ]).toEqual([
      'POST http://requests:8421/api/clients',
      `PATCH http://requests:8421/api/clients/${A_CLIENT.id}`,
      `POST http://requests:8421/api/clients/${A_CLIENT.id}/test`,
      'POST http://requests:8421/api/clients/try',
      `POST http://requests:8421/api/clients/${A_CLIENT.id}/try`,
      `DELETE http://requests:8421/api/clients/${A_CLIENT.id}`,
    ]);
  });

  it('reads the queue, sends a release, and acts on a download', async () => {
    expect(await aClient(200, A_QUEUE).client.downloads()).toEqual({
      kind: 'answered',
      value: A_QUEUE,
    });

    const acting = aClient(200, A_DOWNLOAD);

    expect(
      (
        await acting.client.sendRelease({
          indexerId: A_CLIENT.id,
          url: 'magnet:?',
          title: 'Dune',
          protocol: 'torrent',
          libraryKind: 'movies',
        })
      ).kind,
    ).toBe('answered');
    expect((await acting.client.pauseDownload(A_DOWNLOAD.id)).kind).toBe('answered');
    expect((await acting.client.resumeDownload(A_DOWNLOAD.id)).kind).toBe('answered');

    const quiet = aClient(204, null);

    await quiet.client.removeDownload(A_DOWNLOAD.id, true);
    await quiet.client.removeDownload(A_DOWNLOAD.id, false);
    await quiet.client.watchDownloads(true);
    await quiet.client.acknowledgeDownloadEvents([1, 2]);

    expect([...addressed(acting.fetch), ...addressed(quiet.fetch)]).toEqual([
      'POST http://requests:8421/api/downloads',
      `POST http://requests:8421/api/downloads/${A_DOWNLOAD.id}/pause`,
      `POST http://requests:8421/api/downloads/${A_DOWNLOAD.id}/resume`,
      `DELETE http://requests:8421/api/downloads/${A_DOWNLOAD.id}?deleteData=true`,
      `DELETE http://requests:8421/api/downloads/${A_DOWNLOAD.id}?deleteData=false`,
      'POST http://requests:8421/api/downloads/watch',
      'POST http://requests:8421/api/downloads/events/ack',
    ]);
  });

  it('files a download into the library given', async () => {
    const { client, fetch } = aClient(200, A_DOWNLOAD);

    expect(
      (await client.fileDownload(A_DOWNLOAD.id, { id: 'films', path: '/media/Films' })).kind,
    ).toBe('answered');
    expect(fetch.mock.calls[0]?.[0]).toBe(
      `http://requests:8421/api/downloads/${A_DOWNLOAD.id}/file`,
    );
  });

  it('passes on why a release was not sent', async () => {
    expect(
      await aClient(400, {
        error: 'No torrent client is set up and switched on',
      }).client.sendRelease({
        indexerId: A_CLIENT.id,
        url: 'magnet:?',
        title: 'Dune',
        protocol: 'torrent',
        libraryKind: 'movies',
      }),
    ).toEqual({
      kind: 'refused',
      status: 400,
      error: 'No torrent client is set up and switched on',
    });
  });

  describe('streaming the queue', () => {
    /**
     * A service whose stream says what it is given, then ends.
     */
    const streaming = (said: string, status = 200) =>
      createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: () =>
          Promise.resolve(
            new Response(status === 200 ? said : null, {
              status,
              headers: { 'content-type': 'text/event-stream' },
            }),
          ),
      });

    it('hands on each frame of the stream, skipping what it cannot read', async () => {
      const heard: DownloadStreamFrame[] = [];
      const frame: DownloadStreamFrame = { kind: 'queue', queue: A_QUEUE };

      expect(
        await streaming(
          `data: ${JSON.stringify(frame)}\n\ndata: not json\n\ndata: {"kind":"gossip"}\n\n`,
        ).streamDownloads((read) => heard.push(read), new AbortController().signal),
      ).toBe('http://requests:8421 closed the stream of downloads');
      expect(heard).toEqual([frame]);
    });

    it('says why the stream could not be followed', async () => {
      const signal = new AbortController().signal;

      expect(await streaming('', 401).streamDownloads(() => undefined, signal)).toBe(
        'http://requests:8421 answered 401',
      );

      const offline = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: () => Promise.reject(new TypeError('offline')),
      });

      expect(await offline.streamDownloads(() => undefined, signal)).toBe(
        'http://requests:8421 did not answer',
      );

      const breaking = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch: () =>
          Promise.resolve(
            new Response(
              new ReadableStream({
                start: (controller) => {
                  controller.error(new Error('reset'));
                },
              }),
            ),
          ),
      });

      expect(await breaking.streamDownloads(() => undefined, signal)).toBe(
        'http://requests:8421 stopped streaming the downloads',
      );
    });
  });
});

describe('createRequestsClient with quality profiles', () => {
  const PROFILE = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'HD',
    kind: 'video' as const,
    resolutions: ['1080p' as const],
    sources: ['bluray' as const],
    musicQualities: [],
    smallestMb: null,
    largestMb: null,
    preferredWords: [],
    requiredWords: [],
    bannedWords: [],
    isUpgrading: false,
    releaseWait: 'digital',
    sizes: [],
    upgradeUntilResolution: null,
    upgradeUntilSource: null,
    upgradeUntilMusicQuality: null,
    libraryIds: [],
    preferredLanguage: null,
    isDefault: false,
    roleIds: [],
    accountIds: [],
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  };

  /**
   * A client over a service that answers every call the one way.
   */
  const aClient = (status: number, body: object | null) => {
    const fetch = vi.fn((url: string, init: { method?: string }) => {
      void url;
      void init;

      return Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status }));
    });

    return {
      fetch,
      client: createRequestsClient({ address: 'http://requests:8421', secret: A_SECRET, fetch }),
    };
  };

  it('lists, adds, changes and removes profiles', async () => {
    expect(await aClient(200, [PROFILE]).client.listProfiles()).toEqual({
      kind: 'answered',
      value: [PROFILE],
    });

    const keeping = aClient(200, PROFILE);

    expect((await keeping.client.addProfile({ name: 'HD', kind: 'video' })).kind).toBe('answered');
    expect((await keeping.client.changeProfile(PROFILE.id, { name: 'UHD' })).kind).toBe('answered');
    expect(await aClient(204, null).client.removeProfile(PROFILE.id)).toEqual({
      kind: 'answered',
      value: null,
    });
    expect(keeping.fetch.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url}`)).toEqual(
      [
        'POST http://requests:8421/api/profiles',
        `PATCH http://requests:8421/api/profiles/${PROFILE.id}`,
      ],
    );
  });
});

describe('createRequestsClient with requests for films and series', () => {
  const REQUEST = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    kind: 'film' as const,
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
    state: 'wanted' as const,
    problem: null,
    approval: 'approved' as const,
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

  /**
   * A client over a service that answers every call the one way.
   */
  const aClient = (status: number, body: object | null) => {
    const fetch = vi.fn((url: string, init: { method?: string; body?: string }) => {
      void url;
      void init;

      return Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status }));
    });

    return {
      fetch,
      client: createRequestsClient({ address: 'http://requests:8421', secret: A_SECRET, fetch }),
    };
  };

  it('makes, reads and acts on requests, reading each answer as a request', async () => {
    const one = aClient(200, REQUEST);

    expect(await aClient(200, [REQUEST]).client.listRequests()).toEqual({
      kind: 'answered',
      value: [REQUEST],
    });
    expect(
      await aClient(201, { request: REQUEST, isNew: true }).client.addRequest({
        kind: 'film',
        tmdbId: 438631,
        libraryId: 'films',
        libraryPath: '/media/Films',
        requestedBy: { id: 'someone', name: 'Someone' },
        isApproved: true,
        catalogue: { title: 'Dune', year: 2021 },
      }),
    ).toEqual({ kind: 'answered', value: { request: REQUEST, isNew: true } });

    for (const asked of [
      one.client.findRequest(REQUEST.id),
      one.client.changeRequest(REQUEST.id, { change: { isPickedByHand: true } }),
      one.client.approveRequest(REQUEST.id),
      one.client.refuseRequest(REQUEST.id, 'No room'),
      one.client.retryRequest(REQUEST.id),
      one.client.fulfilRequest(REQUEST.id),
      one.client.requestArrived(REQUEST.id, 'media-1'),
      one.client.updateRequestCatalogue(REQUEST.id, { catalogue: { title: 'Dune', year: 2021 } }),
    ]) {
      expect((await asked).kind).toBe('answered');
    }

    expect(one.fetch.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url}`)).toEqual([
      `GET http://requests:8421/api/requests/${REQUEST.id}`,
      `PATCH http://requests:8421/api/requests/${REQUEST.id}`,
      `POST http://requests:8421/api/requests/${REQUEST.id}/approve`,
      `POST http://requests:8421/api/requests/${REQUEST.id}/refuse`,
      `POST http://requests:8421/api/requests/${REQUEST.id}/retry`,
      `POST http://requests:8421/api/requests/${REQUEST.id}/fulfil`,
      `POST http://requests:8421/api/requests/${REQUEST.id}/arrived`,
      `PUT http://requests:8421/api/requests/${REQUEST.id}/catalogue`,
    ]);
  });

  it('searches by hand for a request not yet made', async () => {
    const outcome = { releases: [], indexers: [], judgements: [], pickedId: null };
    const { client, fetch } = aClient(200, outcome);

    expect(
      await client.releasesForDraft({
        kind: 'film',
        tmdbId: 438631,
        libraryId: 'films',
        libraryPath: '/media/Films',
        requestedBy: { id: 'someone', name: 'Someone' },
        isApproved: true,
        catalogue: { title: 'Dune', year: 2021 },
      }),
    ).toEqual({ kind: 'answered', value: outcome });
    expect(fetch.mock.calls[0]?.[0]).toBe('http://requests:8421/api/requests/releases');
  });

  it('reads what a request has done', async () => {
    expect(
      await aClient(200, [
        { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched for it.' },
      ]).client.requestLog(REQUEST.id),
    ).toMatchObject({ kind: 'answered', value: [{ message: 'Searched for it.' }] });
  });

  it('searches for a request by hand, sends a pick, and removes one', async () => {
    const outcome = { releases: [], indexers: [], judgements: [], pickedId: null };

    expect(await aClient(200, outcome).client.requestReleases(REQUEST.id)).toEqual({
      kind: 'answered',
      value: outcome,
    });
    expect(
      (
        await aClient(400, { error: 'The film is on its way already' }).client.pickRelease(
          REQUEST.id,
          {
            id: 'x',
            title: 'Dune.2021.1080p.WEB-DL',
            indexerId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            indexerName: 'Jackett',
            protocol: 'torrent',
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
          },
        )
      ).kind,
    ).toBe('refused');
    expect((await aClient(204, null).client.removeRequest(REQUEST.id)).kind).toBe('answered');
  });

  it('lists what is followed, and searches for everything missing', async () => {
    expect(
      await aClient(200, [
        {
          id: REQUEST.id,
          kind: 'film',
          tmdbId: 438631,
          musicBrainzId: null,
          openLibraryId: null,
          libraryId: 'films',
        },
      ]).client.followedRequests(),
    ).toMatchObject({ kind: 'answered', value: [{ tmdbId: 438631 }] });
    expect(
      await aClient(200, {
        searched: 3,
        startedAt: '2026-09-19T00:00:00.000Z',
      }).client.searchMissing(),
    ).toMatchObject({ kind: 'answered', value: { searched: 3 } });
  });
});
