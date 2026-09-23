import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createNzbgetAdapter } from './createNzbgetAdapter';
import type { FakeRequest } from '@ValenceRequests/testing/aFakeClient';
import type { ClientSettings } from './DownloadClientAdapter';

const SETTINGS: ClientSettings = {
  name: 'NZBGet',
  url: 'http://nzbget:6789',
  username: 'nzbget',
  password: 'tegbzn6789',
  apiKey: '',
  categories: ['valence'],
};

const CallSchema = z.object({ method: z.string(), params: z.array(JsonValueSchema) });

/**
 * What an RPC call asked.
 */
const callOf = (request: FakeRequest | undefined) =>
  CallSchema.parse(JSON.parse(typeof request?.body === 'string' ? request.body : '{}'));

/**
 * An NZBGet that checks its password, then answers each method as told.
 */
const anNzbget = (results: Record<string, object | string | number | boolean>) =>
  aFakeClient({
    'POST /jsonrpc': (request) => {
      if (
        request.headers['authorization'] !==
        `Basic ${Buffer.from('nzbget:tegbzn6789').toString('base64')}`
      ) {
        return new Response('', { status: 401 });
      }

      const { method } = callOf(request);
      const result = results[method];

      return result === undefined
        ? Response.json({ error: { message: `Unknown method ${method}` } })
        : Response.json({ result });
    },
  });

const GROUP = {
  NZBID: 7,
  NZBName: 'Dune',
  Category: 'valence',
  Status: 'DOWNLOADING',
  FileSizeMB: 100,
  RemainingSizeMB: 40,
};

describe('createNzbgetAdapter', () => {
  it('logs in and reads its version', async () => {
    expect(await createNzbgetAdapter(SETTINGS, anNzbget({ version: '24.3' }).fetch).version()).toBe(
      '24.3',
    );
  });

  it('says the password was wrong', async () => {
    await expect(
      createNzbgetAdapter({ ...SETTINGS, password: 'no' }, anNzbget({}).fetch).version(),
    ).rejects.toThrow('NZBGet refused the username or password');
    await expect(
      createNzbgetAdapter({ ...SETTINGS, password: 'no' }, anNzbget({}).fetch).version(),
    ).rejects.toMatchObject({ problemCode: 'DownloadClientLoginRefused' });
  });

  it('says what NZBGet said, or that something else answered', async () => {
    await expect(createNzbgetAdapter(SETTINGS, anNzbget({}).fetch).version()).rejects.toThrow(
      'NZBGet said: Unknown method version',
    );

    const page = aFakeClient({ 'POST /jsonrpc': () => new Response('<html>') });

    await expect(createNzbgetAdapter(SETTINGS, page.fetch).version()).rejects.toThrow(
      'answered, but not as NZBGet',
    );

    const broken = aFakeClient({ 'POST /jsonrpc': () => new Response('', { status: 500 }) });

    await expect(createNzbgetAdapter(SETTINGS, broken.fetch).version()).rejects.toThrow(
      'NZBGet answered 500',
    );
  });

  it('appends an NZB into its category, named for the release', async () => {
    const { fetch, asked } = anNzbget({ append: 42 });

    expect(
      await createNzbgetAdapter(SETTINGS, fetch).add(
        { kind: 'nzb', bytes: new TextEncoder().encode('<nzb/>') },
        'Dune',
        'valence',
      ),
    ).toBe('42');
    expect(callOf(asked[0]).params.slice(0, 3)).toEqual([
      'Dune.nzb',
      Buffer.from('<nzb/>').toString('base64'),
      'valence',
    ]);
  });

  it('says so when the NZB is refused, and refuses torrents', async () => {
    const adapter = createNzbgetAdapter(SETTINGS, anNzbget({ append: 0 }).fetch);

    await expect(
      adapter.add({ kind: 'nzb', bytes: new Uint8Array() }, 'Dune', 'valence'),
    ).rejects.toThrow('would not take the NZB');
    await expect(
      adapter.add({ kind: 'torrent', bytes: new Uint8Array() }, 'Dune', 'valence'),
    ).rejects.toThrow('takes NZBs, not torrents');
  });

  it('lists its own jobs from the queue and the history', async () => {
    const { fetch } = anNzbget({
      listgroups: [
        GROUP,
        { ...GROUP, NZBID: 8, Status: 'UNPACKING', RemainingSizeMB: 0 },
        { ...GROUP, NZBID: 9, Category: 'tv' },
        { ...GROUP, NZBID: 10, Status: 'PAUSED', FileSizeMB: 0, RemainingSizeMB: 0 },
      ],
      history: [
        {
          NZBID: 1,
          Name: 'Heat',
          Category: 'valence',
          Status: 'SUCCESS/UNPACK',
          FileSizeMB: 2,
          DestDir: '/downloads/valence/Heat.1995',
        },
        { NZBID: 2, Name: 'Alien', Category: 'valence', Status: 'FAILURE/PAR', FileSizeMB: 2 },
        {
          NZBID: 3,
          Name: 'Up',
          Category: 'valence',
          Status: 'WARNING/SCRIPT',
          FileSizeMB: 2,
          DestDir: '/downloads/intermediate/Up',
          FinalDir: '/downloads/valence/Up',
        },
        { NZBID: 4, Name: 'Big', Category: 'valence', Status: 'DELETED/MANUAL', FileSizeMB: 2 },
        { NZBID: 5, Name: 'Twice', Category: 'valence', Status: 'DELETED/DUPE', FileSizeMB: 2 },
        { NZBID: 6, Name: 'Other', Category: 'tv', Status: 'SUCCESS/ALL', FileSizeMB: 2 },
      ],
      status: { DownloadRate: 2 * 1024 * 1024 },
    });

    const listed = await createNzbgetAdapter(SETTINGS, fetch).list();

    expect(listed[0]).toEqual({
      remoteId: '7',
      title: 'Dune',
      state: 'downloading',
      problem: null,
      progress: 0.6,
      sizeBytes: 100 * 1024 * 1024,
      doneBytes: 60 * 1024 * 1024,
      downloadBytesPerSecond: 2 * 1024 * 1024,
      uploadBytesPerSecond: null,
      secondsLeft: 20,
      seeds: null,
      peers: null,
      uploadedBytes: null,
      seedingSeconds: null,
      path: null,
    });
    expect(listed.map((job) => job.path)).toEqual([
      null,
      null,
      null,
      '/downloads/valence/Heat.1995',
      null,
      '/downloads/valence/Up',
      null,
      null,
    ]);
    expect(listed.map((job) => [job.remoteId, job.state, job.problem])).toEqual([
      ['7', 'downloading', null],
      ['8', 'processing', null],
      ['10', 'paused', null],
      ['1', 'done', null],
      ['2', 'failed', 'NZBGet could not finish it (FAILURE/PAR)'],
      ['3', 'done', 'NZBGet finished it with a warning (WARNING/SCRIPT)'],
      ['4', 'failed', 'It was deleted in NZBGet'],
      ['5', 'failed', 'NZBGet dropped it as a duplicate'],
    ]);
    expect(listed[2]?.progress).toBe(0);
    expect(listed[4]?.doneBytes).toBeNull();
  });

  it('gives no job the speed while two are downloading, and does not ask for it', async () => {
    const { fetch, asked } = anNzbget({
      listgroups: [GROUP, { ...GROUP, NZBID: 8 }],
      history: [],
    });

    const listed = await createNzbgetAdapter(SETTINGS, fetch).list();

    expect(listed[0]?.downloadBytesPerSecond).toBeNull();
    expect(listed[0]?.secondsLeft).toBeNull();
    expect(asked.map((request) => callOf(request).method)).not.toContain('status');
  });

  it('reads how fast it is going altogether', async () => {
    expect(
      await createNzbgetAdapter(
        SETTINGS,
        anNzbget({ status: { DownloadRate: 99 } }).fetch,
      ).speeds(),
    ).toEqual({ downloadBytesPerSecond: 99, uploadBytesPerSecond: null });
  });

  it('pauses, resumes and removes a job by its number', async () => {
    const { fetch, asked } = anNzbget({ editqueue: true });
    const adapter = createNzbgetAdapter(SETTINGS, fetch);

    await adapter.pause('7');
    await adapter.resume('7');
    await adapter.remove('7', true);
    await adapter.remove('7', false);

    expect(asked.map((request) => callOf(request).params)).toEqual([
      ['GroupPause', '', [7]],
      ['GroupResume', '', [7]],
      ['GroupFinalDelete', '', [7]],
      ['HistoryFinalDelete', '', [7]],
      ['GroupDelete', '', [7]],
      ['HistoryFinalDelete', '', [7]],
    ]);
  });
});
