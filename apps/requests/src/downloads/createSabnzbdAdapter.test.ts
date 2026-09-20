import { describe, expect, it } from 'vitest';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createSabnzbdAdapter } from './createSabnzbdAdapter';
import type { FakeRequest } from '@ValenceRequests/testing/aFakeClient';
import type { ClientSettings } from './DownloadClientAdapter';

const SETTINGS: ClientSettings = {
  name: 'SABnzbd',
  url: 'http://sabnzbd:8080/sabnzbd/',
  username: '',
  password: '',
  apiKey: 'sab-key',
  categories: ['valence'],
};

const QUEUE = {
  queue: {
    kbpersec: '1024.00',
    slots: [
      {
        nzo_id: 'SABnzbd_nzo_1',
        filename: 'Dune',
        cat: 'valence',
        status: 'Downloading',
        mb: '100.00',
        mbleft: '25.00',
        percentage: '75',
        timeleft: '0:01:05',
      },
      {
        nzo_id: 'SABnzbd_nzo_2',
        filename: 'Arrival',
        cat: 'valence',
        status: 'Verifying',
        mb: '10',
        mbleft: '0',
        percentage: '100',
        timeleft: '0:00:00',
      },
      {
        nzo_id: 'SABnzbd_nzo_3',
        filename: 'Somebody else’s',
        cat: 'tv',
        status: 'Downloading',
        mb: '10',
        mbleft: '5',
        percentage: '50',
        timeleft: '1:00:00:01',
      },
    ],
  },
};

const HISTORY = {
  history: {
    slots: [
      {
        nzo_id: 'SABnzbd_nzo_4',
        name: 'Heat',
        category: 'valence',
        status: 'Completed',
        bytes: 2048,
      },
      {
        nzo_id: 'SABnzbd_nzo_5',
        name: 'Alien',
        category: 'valence',
        status: 'Failed',
        fail_message: 'Out of retention',
        bytes: 100,
      },
      { nzo_id: 'SABnzbd_nzo_6', name: 'Up', category: 'valence', status: 'Failed', bytes: 1 },
      { nzo_id: 'SABnzbd_nzo_7', name: 'Big', category: 'valence', status: 'Extracting', bytes: 5 },
    ],
  },
};

/**
 * A SABnzbd that answers each mode as told, and refuses the wrong key.
 */
const aSabnzbd = (modes: Record<string, object>) =>
  aFakeClient({
    'GET /sabnzbd/api': (request) =>
      request.url.searchParams.get('apikey') === 'sab-key'
        ? Response.json(modes[request.url.searchParams.get('mode') ?? ''] ?? { status: true })
        : Response.json({ status: false, error: 'API Key Incorrect' }),
    'POST /sabnzbd/api': () =>
      Response.json(modes['addfile'] ?? { status: false, error: 'No NZB' }),
  });

/**
 * The query a request asked with.
 */
const queryOf = (request: FakeRequest | undefined) =>
  Object.fromEntries(request?.url.searchParams.entries() ?? []);

describe('createSabnzbdAdapter', () => {
  it('checks the key against the queue, then reads the version', async () => {
    const { fetch, asked } = aSabnzbd({ queue: QUEUE, version: { version: '4.3.2' } });

    expect(await createSabnzbdAdapter(SETTINGS, fetch).version()).toBe('4.3.2');
    expect(queryOf(asked[0])).toEqual({
      output: 'json',
      apikey: 'sab-key',
      mode: 'queue',
      limit: '500',
    });
  });

  it('says the key was refused, whichever way it says so', async () => {
    await expect(
      createSabnzbdAdapter({ ...SETTINGS, apiKey: 'wrong' }, aSabnzbd({}).fetch).version(),
    ).rejects.toThrow('SABnzbd refused the API key');

    const forbidden = aFakeClient({
      'GET /sabnzbd/api': () => new Response('API Key Incorrect', { status: 403 }),
    });

    await expect(createSabnzbdAdapter(SETTINGS, forbidden.fetch).version()).rejects.toThrow(
      'SABnzbd refused the API key',
    );

    const plain = aFakeClient({ 'GET /sabnzbd/api': () => new Response('API Key Required') });

    await expect(createSabnzbdAdapter(SETTINGS, plain.fetch).version()).rejects.toThrow(
      'SABnzbd refused the API key',
    );
  });

  it('says so when something else answers, or SABnzbd says why not', async () => {
    const page = aFakeClient({ 'GET /sabnzbd/api': () => new Response('<html>login</html>') });

    await expect(createSabnzbdAdapter(SETTINGS, page.fetch).version()).rejects.toThrow(
      'answered, but not as SABnzbd',
    );

    const refusing = aFakeClient({
      'GET /sabnzbd/api': () => Response.json({ status: false, error: 'Not now' }),
    });

    await expect(createSabnzbdAdapter(SETTINGS, refusing.fetch).version()).rejects.toThrow(
      'SABnzbd said: Not now',
    );

    const broken = aFakeClient({ 'GET /sabnzbd/api': () => new Response('', { status: 502 }) });

    await expect(createSabnzbdAdapter(SETTINGS, broken.fetch).version()).rejects.toThrow(
      'SABnzbd answered 502',
    );
  });

  it('makes its category the first time, since SABnzbd would file the job elsewhere', async () => {
    const { fetch, asked } = aSabnzbd({
      get_cats: { categories: ['*', 'movies'] },
      addfile: { status: true, nzo_ids: ['SABnzbd_nzo_9'] },
    });

    await createSabnzbdAdapter(SETTINGS, fetch).add(
      { kind: 'nzb', bytes: new Uint8Array() },
      'Dune',
      'valence',
    );

    expect(queryOf(asked[1])).toMatchObject({
      mode: 'set_config',
      section: 'categories',
      keyword: 'valence',
      name: 'valence',
    });
  });

  it('uploads an NZB into its category, under the release’s name', async () => {
    const { fetch, asked } = aSabnzbd({
      get_cats: { categories: ['*', 'Valence'] },
      addfile: { status: true, nzo_ids: ['SABnzbd_nzo_9'] },
    });

    expect(
      await createSabnzbdAdapter(SETTINGS, fetch).add(
        { kind: 'nzb', bytes: new TextEncoder().encode('<nzb/>') },
        'Dune',
        'valence',
      ),
    ).toBe('SABnzbd_nzo_9');

    const added = asked.at(-1);
    const form = added?.body instanceof FormData ? added.body : new FormData();

    expect(asked).toHaveLength(2);
    expect(form.get('cat')).toBe('valence');
    expect(form.get('nzbname')).toBe('Dune');
    expect(form.get('apikey')).toBe('sab-key');
    expect(form.get('name')).toBeInstanceOf(Blob);
  });

  it('says so when the NZB is refused, and refuses torrents', async () => {
    const adapter = createSabnzbdAdapter(
      SETTINGS,
      aSabnzbd({ get_cats: { categories: ['valence'] }, addfile: { status: true, nzo_ids: [] } })
        .fetch,
    );

    await expect(
      adapter.add({ kind: 'nzb', bytes: new Uint8Array() }, 'Dune', 'valence'),
    ).rejects.toThrow('would not take the NZB');
    await expect(
      adapter.add({ kind: 'magnet', url: 'magnet:?' }, 'Dune', 'valence'),
    ).rejects.toThrow('takes NZBs, not torrents');
  });

  it('lists its own jobs from the queue and the history', async () => {
    const { fetch } = aSabnzbd({ queue: QUEUE, history: HISTORY });

    const listed = await createSabnzbdAdapter(SETTINGS, fetch).list();

    expect(listed[0]).toEqual({
      remoteId: 'SABnzbd_nzo_1',
      title: 'Dune',
      state: 'downloading',
      problem: null,
      progress: 0.75,
      sizeBytes: 100 * 1024 * 1024,
      doneBytes: 75 * 1024 * 1024,
      downloadBytesPerSecond: 1024 * 1024,
      uploadBytesPerSecond: null,
      secondsLeft: 65,
      seeds: null,
      peers: null,
    });
    expect(listed.map((job) => [job.remoteId, job.state, job.problem])).toEqual([
      ['SABnzbd_nzo_1', 'downloading', null],
      ['SABnzbd_nzo_2', 'processing', null],
      ['SABnzbd_nzo_4', 'done', null],
      ['SABnzbd_nzo_5', 'failed', 'Out of retention'],
      ['SABnzbd_nzo_6', 'failed', 'SABnzbd could not finish it'],
      ['SABnzbd_nzo_7', 'processing', null],
    ]);
    expect(listed[1]?.secondsLeft).toBeNull();
  });

  it('gives no one job the speed while two are downloading, and reads days left', async () => {
    const both = {
      queue: {
        ...QUEUE.queue,
        slots: QUEUE.queue.slots.map((slot) => ({ ...slot, cat: 'valence' })),
      },
    };
    const { fetch } = aSabnzbd({ queue: both, history: { history: { slots: [] } } });

    const listed = await createSabnzbdAdapter(SETTINGS, fetch).list();

    expect(listed[0]?.downloadBytesPerSecond).toBeNull();
    expect(listed[2]?.secondsLeft).toBe(86_401);
  });

  it('reads how fast it is going altogether, with nothing going up', async () => {
    const { fetch } = aSabnzbd({ queue: QUEUE });

    expect(await createSabnzbdAdapter(SETTINGS, fetch).speeds()).toEqual({
      downloadBytesPerSecond: 1024 * 1024,
      uploadBytesPerSecond: null,
    });
  });

  it('pauses, resumes and removes a job, from the queue and the history', async () => {
    const { fetch, asked } = aSabnzbd({});
    const adapter = createSabnzbdAdapter(SETTINGS, fetch);

    await adapter.pause('SABnzbd_nzo_1');
    await adapter.resume('SABnzbd_nzo_1');
    await adapter.remove('SABnzbd_nzo_1', true);
    await adapter.remove('SABnzbd_nzo_1', false);

    expect(
      asked.map(queryOf).map(({ mode, name, value, del_files }) => [mode, name, value, del_files]),
    ).toEqual([
      ['queue', 'pause', 'SABnzbd_nzo_1', undefined],
      ['queue', 'resume', 'SABnzbd_nzo_1', undefined],
      ['queue', 'delete', 'SABnzbd_nzo_1', '1'],
      ['history', 'delete', 'SABnzbd_nzo_1', '1'],
      ['queue', 'delete', 'SABnzbd_nzo_1', '0'],
      ['history', 'delete', 'SABnzbd_nzo_1', '0'],
    ]);
  });
});
