import { describe, expect, it } from 'vitest';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createQbittorrentAdapter } from './createQbittorrentAdapter';
import type { FakeRequest } from '@ValenceRequests/testing/aFakeClient';
import type { ClientSettings } from './DownloadClientAdapter';

const SETTINGS: ClientSettings = {
  name: 'qBittorrent',
  url: 'http://qbittorrent:8080/',
  username: 'admin',
  password: 'secret',
  apiKey: '',
  category: 'valence',
};

const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

const MAGNET = `magnet:?xt=urn:btih:${HASH.toUpperCase()}&dn=Dune`;

/**
 * A qBittorrent login that hands out the cookie given.
 */
const loggingIn =
  (sid = 'SID=abc') =>
  () =>
    new Response('Ok.', { headers: { 'set-cookie': `${sid}; HttpOnly; path=/` } });

/**
 * Whether a request carried the session cookie.
 */
const hasCookie = (request: FakeRequest) => request.headers['cookie'] === 'SID=abc';

/**
 * A form body read back as its fields.
 */
const formOf = (request: FakeRequest | undefined) =>
  new URLSearchParams(typeof request?.body === 'string' ? request.body : '');

describe('createQbittorrentAdapter', () => {
  it('logs in, then asks with the cookie it was given', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'GET /api/v2/app/version': (request) =>
        hasCookie(request) ? new Response('v5.0.1\n') : new Response('', { status: 403 }),
    });

    expect(await createQbittorrentAdapter(SETTINGS, fetch).version()).toBe('v5.0.1');
    expect(formOf(asked[0]).get('password')).toBe('secret');
    expect(asked[0]?.headers['referer']).toBe('http://qbittorrent:8080/');
  });

  it('says the password was wrong', async () => {
    const { fetch } = aFakeClient({ 'POST /api/v2/auth/login': () => new Response('Fails.') });

    await expect(createQbittorrentAdapter(SETTINGS, fetch).version()).rejects.toThrow(
      'qBittorrent refused the username or password',
    );
  });

  it('says when it has banned Valence for too many wrong passwords', async () => {
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': () => new Response('', { status: 403 }),
    });

    await expect(createQbittorrentAdapter(SETTINGS, fetch).version()).rejects.toThrow(
      'banned this address',
    );
  });

  it('logs in again when the cookie lapses', async () => {
    let logins = 0;
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': () => {
        logins += 1;

        return loggingIn(logins === 1 ? 'SID=old' : 'SID=abc')();
      },
      'GET /api/v2/app/version': (request) =>
        hasCookie(request) ? new Response('v4.6.2') : new Response('', { status: 403 }),
    });

    expect(await createQbittorrentAdapter(SETTINGS, fetch).version()).toBe('v4.6.2');
    expect(logins).toBe(2);
  });

  it('gives up when a fresh cookie is refused too', async () => {
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'GET /api/v2/app/version': () => new Response('', { status: 403 }),
    });

    await expect(createQbittorrentAdapter(SETTINGS, fetch).version()).rejects.toThrow(
      'refused the username or password',
    );
  });

  it('works without a login where qBittorrent lets this address straight in', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': () => new Response('Ok.'),
      'GET /api/v2/app/version': () => new Response('v5.0.1'),
    });
    const adapter = createQbittorrentAdapter(SETTINGS, fetch);

    await adapter.version();
    await adapter.version();

    expect(asked.filter((request) => request.url.pathname.endsWith('/login'))).toHaveLength(1);
    expect(asked[1]?.headers['cookie']).toBeUndefined();
  });

  it('adds a magnet link in its category, and names it by its hash', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/createCategory': () => new Response('', { status: 409 }),
      'POST /api/v2/torrents/add': () => new Response('Ok.'),
    });

    expect(
      await createQbittorrentAdapter(SETTINGS, fetch).add({ kind: 'magnet', url: MAGNET }, 'Dune'),
    ).toBe(HASH);

    const added = asked.find((request) => request.url.pathname.endsWith('/add'));

    expect(added?.body).toBeInstanceOf(FormData);

    const form = added?.body instanceof FormData ? added.body : new FormData();

    expect(form.get('urls')).toBe(MAGNET);
    expect(form.get('category')).toBe('valence');
    expect(formOf(asked[1]).get('category')).toBe('valence');
  });

  it('adds a torrent file', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/createCategory': () => new Response(''),
      'POST /api/v2/torrents/add': () => new Response('Ok.'),
    });
    const bytes = new TextEncoder().encode(
      'd4:infod6:lengthi5e4:name3:abc12:piece lengthi16384e6:pieces0:ee',
    );

    expect(
      await createQbittorrentAdapter(SETTINGS, fetch).add({ kind: 'torrent', bytes }, 'Abc'),
    ).toBe('f697e5114ed0e822312d869e459189a9cb0124a5');

    const added = asked.find((request) => request.url.pathname.endsWith('/add'));
    const form = added?.body instanceof FormData ? added.body : new FormData();

    expect(form.get('torrents')).toBeInstanceOf(Blob);
  });

  it('refuses an NZB, and a torrent it cannot read', async () => {
    const adapter = createQbittorrentAdapter(SETTINGS, aFakeClient({}).fetch);

    await expect(adapter.add({ kind: 'nzb', bytes: new Uint8Array() }, 'Dune')).rejects.toThrow(
      'takes torrents, not NZBs',
    );
    await expect(
      adapter.add({ kind: 'torrent', bytes: new TextEncoder().encode('<html>') }, 'Dune'),
    ).rejects.toThrow('not a torrent Valence can read');
  });

  it('says so when the category cannot be made, or the torrent is refused', async () => {
    const refusingCategory = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/createCategory': () => new Response('', { status: 400 }),
    });

    await expect(
      createQbittorrentAdapter(SETTINGS, refusingCategory.fetch).add(
        { kind: 'magnet', url: MAGNET },
        'Dune',
      ),
    ).rejects.toThrow('would not make the category valence');

    const refusingTorrent = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/createCategory': () => new Response(''),
      'POST /api/v2/torrents/add': () => new Response('Fails.'),
    });

    await expect(
      createQbittorrentAdapter(SETTINGS, refusingTorrent.fetch).add(
        { kind: 'magnet', url: MAGNET },
        'Dune',
      ),
    ).rejects.toThrow('would not take the torrent');
  });

  it('lists only its own category, reading each torrent’s state', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'GET /api/v2/torrents/info': () =>
        Response.json([
          {
            hash: HASH.toUpperCase(),
            name: 'Dune',
            state: 'downloading',
            progress: 0.25,
            size: 4000,
            completed: 1000,
            dlspeed: 500,
            upspeed: 20,
            eta: 6,
            num_seeds: 12,
            num_leechs: 3,
          },
          {
            hash: 'b',
            name: 'Arrival',
            state: 'stalledDL',
            progress: 0.5,
            total_size: 10,
            eta: 8_640_000,
          },
          { hash: 'c', name: 'Heat', state: 'missingFiles', progress: 0.1 },
          { hash: 'd', name: 'Alien', state: 'somethingNew', progress: 2 },
        ]),
    });

    const [dune, arrival, heat, alien] = await createQbittorrentAdapter(SETTINGS, fetch).list();

    expect(asked.at(-1)?.url.searchParams.get('category')).toBe('valence');
    expect(dune).toEqual({
      remoteId: HASH,
      title: 'Dune',
      state: 'downloading',
      problem: null,
      progress: 0.25,
      sizeBytes: 4000,
      doneBytes: 1000,
      downloadBytesPerSecond: 500,
      uploadBytesPerSecond: 20,
      secondsLeft: 6,
      seeds: 12,
      peers: 3,
    });
    expect(arrival?.state).toBe('stalled');
    expect(arrival?.doneBytes).toBe(5);
    expect(arrival?.secondsLeft).toBeNull();
    expect(heat?.state).toBe('failed');
    expect(heat?.problem).toBe('qBittorrent cannot find its files');
    expect(heat?.sizeBytes).toBeNull();
    expect(heat?.doneBytes).toBeNull();
    expect(alien?.state).toBe('queued');
    expect(alien?.progress).toBe(1);
  });

  it('reads how fast it is going altogether', async () => {
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'GET /api/v2/transfer/info': () => Response.json({ dl_info_speed: 900, up_info_speed: 40 }),
    });

    expect(await createQbittorrentAdapter(SETTINGS, fetch).speeds()).toEqual({
      downloadBytesPerSecond: 900,
      uploadBytesPerSecond: 40,
    });
  });

  it('says what it answered where it did not answer well', async () => {
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'GET /api/v2/transfer/info': () => new Response('', { status: 500 }),
    });

    await expect(createQbittorrentAdapter(SETTINGS, fetch).speeds()).rejects.toThrow(
      'qBittorrent answered 500',
    );
  });

  it('stops and starts a torrent in qBittorrent 5', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/stop': () => new Response(''),
      'POST /api/v2/torrents/start': () => new Response(''),
    });
    const adapter = createQbittorrentAdapter(SETTINGS, fetch);

    await adapter.pause(HASH);
    await adapter.resume(HASH);

    expect(asked.map((request) => request.url.pathname)).toEqual([
      '/api/v2/auth/login',
      '/api/v2/torrents/stop',
      '/api/v2/torrents/start',
    ]);
    expect(formOf(asked[1]).get('hashes')).toBe(HASH);
  });

  it('pauses and resumes a torrent in qBittorrent 4', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/pause': () => new Response(''),
      'POST /api/v2/torrents/resume': () => new Response(''),
    });
    const adapter = createQbittorrentAdapter(SETTINGS, fetch);

    await adapter.pause(HASH);
    await adapter.resume(HASH);

    expect(asked.map((request) => request.url.pathname)).toContain('/api/v2/torrents/resume');
  });

  it('says so where stopping is refused outright', async () => {
    const { fetch } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/stop': () => new Response('', { status: 409 }),
    });

    await expect(createQbittorrentAdapter(SETTINGS, fetch).pause(HASH)).rejects.toThrow(
      'answered 409',
    );
  });

  it('removes a torrent, deleting its files only where asked', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /api/v2/auth/login': loggingIn(),
      'POST /api/v2/torrents/delete': () => new Response(''),
    });
    const adapter = createQbittorrentAdapter(SETTINGS, fetch);

    await adapter.remove(HASH, true);
    await adapter.remove(HASH, false);

    expect(formOf(asked[1]).get('deleteFiles')).toBe('true');
    expect(formOf(asked[2]).get('deleteFiles')).toBe('false');
  });
});
