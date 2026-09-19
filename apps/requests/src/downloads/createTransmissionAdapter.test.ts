import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createTransmissionAdapter } from './createTransmissionAdapter';
import type { FakeRequest } from '@ValenceRequests/testing/aFakeClient';
import type { ClientSettings } from './DownloadClientAdapter';

const SETTINGS: ClientSettings = {
  name: 'Transmission',
  url: 'http://transmission:9091',
  username: '',
  password: '',
  apiKey: '',
  category: 'valence',
};

const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

const RpcSchema = z.object({
  method: z.string(),
  arguments: z.record(z.string(), JsonValueSchema),
});

/**
 * What an RPC call asked.
 */
const rpcOf = (request: FakeRequest | undefined) =>
  RpcSchema.parse(JSON.parse(typeof request?.body === 'string' ? request.body : '{}'));

/**
 * A Transmission that insists on its session id, then answers each method as told.
 */
const aTransmission = (answers: Record<string, object>, result = 'success') =>
  aFakeClient({
    'POST /transmission/rpc': (request) => {
      if (request.headers['x-transmission-session-id'] !== 'session-1') {
        return new Response('', {
          status: 409,
          headers: { 'x-transmission-session-id': 'session-1' },
        });
      }

      return Response.json({ result, arguments: answers[rpcOf(request).method] ?? {} });
    },
  });

const TORRENT = {
  hashString: HASH.toUpperCase(),
  name: 'Dune',
  status: 4,
  error: 0,
  errorString: '',
  percentDone: 0.5,
  sizeWhenDone: 1000,
  leftUntilDone: 500,
  rateDownload: 200,
  rateUpload: 10,
  eta: 3,
  peersSendingToUs: 4,
  peersGettingFromUs: 1,
  labels: ['valence'],
};

describe('createTransmissionAdapter', () => {
  it('fetches a session id, then asks again with it', async () => {
    const { fetch, asked } = aTransmission({ 'session-get': { version: '4.0.6' } });

    expect(await createTransmissionAdapter(SETTINGS, fetch).version()).toBe('4.0.6');
    expect(asked).toHaveLength(2);
  });

  it('finds the RPC from the address of its web page, or from its own address', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /transmission/rpc': () =>
        Response.json({ result: 'success', arguments: { version: '3.00' } }),
    });

    await createTransmissionAdapter(
      { ...SETTINGS, url: 'http://transmission:9091/transmission/web/' },
      fetch,
    ).version();
    await createTransmissionAdapter(
      { ...SETTINGS, url: 'http://transmission:9091/transmission/rpc' },
      fetch,
    ).version();

    expect(asked.map((request) => request.url.pathname)).toEqual([
      '/transmission/rpc',
      '/transmission/rpc',
    ]);
  });

  it('logs in with the username and password where it has them', async () => {
    const { fetch, asked } = aFakeClient({
      'POST /transmission/rpc': (request) =>
        request.headers['authorization'] === `Basic ${Buffer.from('me:pw').toString('base64')}`
          ? Response.json({ result: 'success', arguments: { version: '4.0.6' } })
          : new Response('', { status: 401 }),
    });

    await createTransmissionAdapter(
      { ...SETTINGS, username: 'me', password: 'pw' },
      fetch,
    ).version();

    expect(asked).toHaveLength(1);
    await expect(createTransmissionAdapter(SETTINGS, fetch).version()).rejects.toThrow(
      'Transmission refused the username or password',
    );
  });

  it('says what went wrong where Transmission says so', async () => {
    await expect(
      createTransmissionAdapter(SETTINGS, aTransmission({}, 'duplicate torrent').fetch).version(),
    ).rejects.toThrow('Transmission said: duplicate torrent');

    const broken = aFakeClient({
      'POST /transmission/rpc': () => new Response('', { status: 500 }),
    });

    await expect(createTransmissionAdapter(SETTINGS, broken.fetch).version()).rejects.toThrow(
      'Transmission answered 500',
    );
  });

  it('adds a magnet link and labels it, naming it by its hash', async () => {
    const { fetch, asked } = aTransmission({
      'torrent-add': { 'torrent-added': { hashString: HASH.toUpperCase(), id: 1, name: 'Dune' } },
    });

    expect(
      await createTransmissionAdapter(SETTINGS, fetch).add(
        { kind: 'magnet', url: 'magnet:?xt=urn:btih:x' },
        'Dune',
      ),
    ).toBe(HASH);

    const calls = asked
      .filter((request) => request.headers['x-transmission-session-id'] === 'session-1')
      .map(rpcOf);

    expect(calls[0]?.arguments).toEqual({ filename: 'magnet:?xt=urn:btih:x' });
    expect(calls[1]).toEqual({
      method: 'torrent-set',
      arguments: { ids: [HASH], labels: ['valence'] },
    });
  });

  it('adds a torrent file it already had, as the one it had', async () => {
    const { fetch, asked } = aTransmission({
      'torrent-add': { 'torrent-duplicate': { hashString: HASH } },
    });

    expect(
      await createTransmissionAdapter(SETTINGS, fetch).add(
        { kind: 'torrent', bytes: new TextEncoder().encode('d4:infode') },
        'Dune',
      ),
    ).toBe(HASH);
    expect(rpcOf(asked[1]).arguments['metainfo']).toBe(Buffer.from('d4:infode').toString('base64'));
  });

  it('refuses an NZB', async () => {
    await expect(
      createTransmissionAdapter(SETTINGS, aFakeClient({}).fetch).add(
        { kind: 'nzb', bytes: new Uint8Array() },
        'Dune',
      ),
    ).rejects.toThrow('takes torrents, not NZBs');
  });

  it('lists only the torrents with its label, reading what each is doing', async () => {
    const { fetch } = aTransmission({
      'torrent-get': {
        torrents: [
          TORRENT,
          { ...TORRENT, hashString: 'other', labels: [] },
          { ...TORRENT, hashString: 'b', status: 4, rateDownload: 0, peersSendingToUs: 0 },
          { ...TORRENT, hashString: 'c', status: 0 },
          { ...TORRENT, hashString: 'd', status: 6, percentDone: 1, eta: -1 },
          { ...TORRENT, hashString: 'e', status: 2 },
          { ...TORRENT, hashString: 'f', status: 3 },
          { ...TORRENT, hashString: 'g', error: 3, errorString: 'No data found!' },
          { ...TORRENT, hashString: 'h', error: 2, errorString: 'Tracker gone' },
        ],
      },
    });

    const listed = await createTransmissionAdapter(SETTINGS, fetch).list();

    expect(listed[0]).toEqual({
      remoteId: HASH,
      title: 'Dune',
      state: 'downloading',
      problem: null,
      progress: 0.5,
      sizeBytes: 1000,
      doneBytes: 500,
      downloadBytesPerSecond: 200,
      uploadBytesPerSecond: 10,
      secondsLeft: 3,
      seeds: 4,
      peers: 1,
    });
    expect(listed.map((torrent) => [torrent.remoteId, torrent.state])).toEqual([
      [HASH, 'downloading'],
      ['b', 'stalled'],
      ['c', 'paused'],
      ['d', 'done'],
      ['e', 'processing'],
      ['f', 'queued'],
      ['g', 'failed'],
      ['h', 'downloading'],
    ]);
    expect(listed[6]?.problem).toBe('No data found!');
    expect(listed[7]?.problem).toBe('Tracker gone');
  });

  it('reads how fast it is going altogether', async () => {
    const { fetch } = aTransmission({ 'session-stats': { downloadSpeed: 700, uploadSpeed: 30 } });

    expect(await createTransmissionAdapter(SETTINGS, fetch).speeds()).toEqual({
      downloadBytesPerSecond: 700,
      uploadBytesPerSecond: 30,
    });
  });

  it('stops, starts and removes a torrent by its hash', async () => {
    const { fetch, asked } = aTransmission({});
    const adapter = createTransmissionAdapter(SETTINGS, fetch);

    await adapter.pause(HASH);
    await adapter.resume(HASH);
    await adapter.remove(HASH, true);

    expect(
      asked
        .filter((request) => request.headers['x-transmission-session-id'] === 'session-1')
        .map(rpcOf),
    ).toEqual([
      { method: 'torrent-stop', arguments: { ids: [HASH] } },
      { method: 'torrent-start', arguments: { ids: [HASH] } },
      { method: 'torrent-remove', arguments: { ids: [HASH], 'delete-local-data': true } },
    ]);
  });
});
