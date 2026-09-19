import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import { aSentDownload } from '@ValenceRequests/testing/aSentDownload';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { createDownloadQueue } from './createDownloadQueue';
import { createMemoryEventStore } from '@ValenceRequests/events/createMemoryEventStore';
import { DownloadClientFailure } from './DownloadClientFailure';
import type { DownloadStreamFrame } from '@ValenceContracts/schemas/DownloadQueue';
import type { TorrentFile } from './TorrentFile';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import type { ClientItem, DownloadClientAdapter } from './DownloadClientAdapter';
import type { DownloadClientRecord } from './DownloadClientRecord';
import type { SentDownloadRecord } from './SentDownloadRecord';

const AT = new Date('2026-09-19T00:00:00.000Z');

const INDEXER_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

const QBITTORRENT = aDownloadClient();

/**
 * What a client says about one download.
 */
const anItem = (overrides: Partial<ClientItem> = {}): ClientItem => ({
  remoteId: HASH,
  title: 'Dune',
  state: 'downloading',
  problem: null,
  progress: 0.5,
  sizeBytes: 1000,
  doneBytes: 500,
  downloadBytesPerSecond: 100,
  uploadBytesPerSecond: 5,
  secondsLeft: 5,
  seeds: 9,
  peers: 2,
  path: null,
  ...overrides,
});

/**
 * A client that lists what it is given.
 */
const anAdapter = (items: ClientItem[] = []) => {
  const adapter = {
    version: vi.fn(() => Promise.resolve('v5')),
    add: vi.fn((file: ReleaseFile, title: string, category: string) => {
      void file;
      void title;
      void category;

      return Promise.resolve(HASH);
    }),
    list: vi.fn(() => Promise.resolve(items)),
    speeds: vi.fn(() => Promise.resolve({ downloadBytesPerSecond: 900, uploadBytesPerSecond: 40 })),
    pause: vi.fn((remoteId: string) => {
      void remoteId;

      return Promise.resolve();
    }),
    resume: vi.fn((remoteId: string) => {
      void remoteId;

      return Promise.resolve();
    }),
    remove: vi.fn((remoteId: string, deleteData: boolean) => {
      void remoteId;
      void deleteData;

      return Promise.resolve();
    }),
  } satisfies DownloadClientAdapter;

  return adapter;
};

/**
 * A queue over the clients and downloads given, each client speaking through the one adapter.
 */
const aQueue = ({
  clients = [QBITTORRENT],
  sent = [],
  adapter = anAdapter(),
  fetchRelease = vi.fn((indexerId: string, url: string) => {
    void indexerId;
    void url;

    return Promise.resolve<ReleaseFile | null>({ kind: 'torrent', bytes: new Uint8Array([1]) });
  }),
}: {
  clients?: DownloadClientRecord[];
  sent?: SentDownloadRecord[];
  adapter?: ReturnType<typeof anAdapter>;
  fetchRelease?: (indexerId: string, url: string) => Promise<ReleaseFile | null>;
} = {}) => {
  const store = createMemoryRecordStore(clients);
  const downloads = createMemoryRecordStore(sent);
  const events = createMemoryEventStore(() => AT);
  const waits: { run: () => void; afterMs: number; isCancelled: boolean }[] = [];
  const schedule = vi.fn((run: () => void, afterMs: number) => {
    const wait = { run, afterMs, isCancelled: false };

    waits.push(wait);

    return () => {
      wait.isCancelled = true;
    };
  });
  const queue = createDownloadQueue({
    clients: { records: () => store.list(), adapterOf: () => adapter },
    downloads,
    events,
    fetchRelease,
    now: () => AT,
    schedule,
  });

  return { queue, store, downloads, events, adapter, fetchRelease, waits };
};

const SEND = {
  indexerId: INDEXER_ID,
  url: 'http://jackett/dl/1',
  title: 'Dune',
  protocol: 'torrent' as const,
  libraryKind: 'movies' as const,
  sizeBytes: 1000,
  indexerName: 'Jackett',
};

/**
 * A client that lists the download given, and knows the files the torrent holds.
 */
const aSortingAdapter = (files: TorrentFile[] | null) => ({
  ...anAdapter([anItem()]),
  files: vi.fn((remoteId: string) => {
    void remoteId;

    return Promise.resolve(files);
  }),
  skip: vi.fn((remoteId: string, indices: readonly number[]) => {
    void remoteId;
    void indices;

    return Promise.resolve();
  }),
});

describe('createDownloadQueue', () => {
  describe('leaving out what no library takes', () => {
    it('leaves a torrent’s notes and samples out once, and fetches the rest', async () => {
      const adapter = aSortingAdapter([
        { index: 0, name: 'Dune/Dune.2021.mkv' },
        { index: 1, name: 'Dune/RARBG.txt' },
        { index: 2, name: 'Dune/Sample/sample.mkv' },
      ]);
      const { queue, downloads } = aQueue({ sent: [aSentDownload()], adapter });

      await queue.check();
      await queue.check();

      expect(adapter.skip).toHaveBeenCalledTimes(1);
      expect(adapter.skip).toHaveBeenCalledWith(HASH, [1, 2]);
      expect(await downloads.find(aSentDownload().id)).toMatchObject({
        state: 'downloading',
        filesChecked: true,
      });
    });

    it('throws out a torrent that holds a program, saying which', async () => {
      const adapter = aSortingAdapter([
        { index: 0, name: 'Dune/Dune.2021.1080p.mkv.exe' },
        { index: 1, name: 'Dune/Dune.2021.1080p.mkv.lnk' },
      ]);
      const { queue, downloads, events } = aQueue({ sent: [aSentDownload()], adapter });

      await queue.check();

      const problem =
        'It holds a program, Dune/Dune.2021.1080p.mkv.exe, which no film, series, album or book comes with';

      expect(adapter.remove).toHaveBeenCalledWith(HASH, true);
      expect(adapter.skip).not.toHaveBeenCalled();
      expect(await downloads.find(aSentDownload().id)).toMatchObject({ state: 'failed', problem });
      expect(await events.pending()).toMatchObject([{ kind: 'failed', problem }]);
    });

    it('throws out a torrent that holds nothing a library takes', async () => {
      const { queue, downloads } = aQueue({
        sent: [aSentDownload()],
        adapter: aSortingAdapter([{ index: 0, name: 'Dune.rar' }]),
      });

      await queue.check();

      expect(await downloads.find(aSentDownload().id)).toMatchObject({
        state: 'failed',
        problem: 'It holds nothing Valence can file',
      });
    });

    it('waits for a magnet link to say what it holds, and leaves usenet be', async () => {
      const waiting = aSortingAdapter(null);
      const magnet = aQueue({ sent: [aSentDownload()], adapter: waiting });

      await magnet.queue.check();

      expect(waiting.skip).not.toHaveBeenCalled();
      expect((await magnet.downloads.find(aSentDownload().id))?.filesChecked).toBe(false);

      const usenet = aSortingAdapter([{ index: 0, name: 'Dune.exe' }]);
      const nzb = aQueue({ sent: [aSentDownload({ protocol: 'usenet' })], adapter: usenet });

      await nzb.queue.check();

      expect(usenet.files).not.toHaveBeenCalled();
    });
  });

  describe('sending', () => {
    it('fetches the release and hands it to the first torrent client that is on', async () => {
      const second = aDownloadClient({
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'Second',
        priority: 30,
      });
      const { queue, downloads, events, adapter, fetchRelease } = aQueue({
        clients: [
          second,
          aDownloadClient({
            id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
            name: 'Off',
            priority: 1,
            isEnabled: false,
          }),
          aDownloadClient({
            id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
            name: 'SAB',
            kind: 'sabnzbd',
            priority: 1,
          }),
          QBITTORRENT,
        ],
      });

      const sent = await queue.send(SEND);

      expect(fetchRelease).toHaveBeenCalledWith(INDEXER_ID, 'http://jackett/dl/1');
      expect(adapter.add).toHaveBeenCalledWith(
        { kind: 'torrent', bytes: new Uint8Array([1]) },
        'Dune',
        'valence-films',
      );
      expect(sent).toMatchObject({
        clientId: QBITTORRENT.id,
        clientName: 'qBittorrent',
        title: 'Dune',
        indexerName: 'Jackett',
        state: 'queued',
        progress: 0,
        sizeBytes: 1000,
        sentAt: AT.toISOString(),
      });
      expect((await downloads.list())[0]?.remoteId).toBe(HASH);
      expect(await events.pending()).toEqual([
        {
          id: 1,
          kind: 'started',
          title: 'Dune',
          clientName: 'qBittorrent',
          at: AT.toISOString(),
        },
      ]);
    });

    it('hands a magnet link over as it is', async () => {
      const { queue, adapter, fetchRelease } = aQueue();

      await queue.send({ ...SEND, url: 'magnet:?xt=urn:btih:x' });

      expect(fetchRelease).not.toHaveBeenCalled();
      expect(adapter.add).toHaveBeenCalledWith(
        { kind: 'magnet', url: 'magnet:?xt=urn:btih:x' },
        'Dune',
        'valence-films',
      );
    });

    it('files a release under the category for the kind of library it is for', async () => {
      const { queue, adapter, downloads } = aQueue();

      expect(await queue.send({ ...SEND, libraryKind: 'shows' })).toMatchObject({
        libraryKind: 'shows',
      });
      expect(adapter.add.mock.calls[0]?.[2]).toBe('valence-series');
      expect((await downloads.list())[0]?.libraryKind).toBe('shows');
    });

    it('remembers the library a release is for, even one sent before', async () => {
      const { queue, downloads } = aQueue();
      const library = { id: 'films', path: '/media/Films' };

      await queue.send(SEND);
      await queue.send({ ...SEND, library });

      expect(await downloads.list()).toMatchObject([
        { libraryId: 'films', libraryPath: '/media/Films', filedInto: null },
      ]);

      const [kept] = await downloads.list();

      await downloads.update(kept?.id ?? '', { filedInto: '/media/Films/Dune (2021)' });
      await queue.send({ ...SEND, library: { id: 'other', path: '/media/Other' } });

      expect((await downloads.list())[0]?.libraryId).toBe('films');
    });

    it('sends to the client asked for', async () => {
      const chosen = aDownloadClient({
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'Chosen',
        priority: 40,
      });
      const { queue } = aQueue({ clients: [QBITTORRENT, chosen] });

      expect(await queue.send({ ...SEND, clientId: chosen.id })).toMatchObject({
        clientName: 'Chosen',
      });
    });

    it('says why nothing could take it', async () => {
      expect(await aQueue({ clients: [] }).queue.send(SEND)).toBe(
        'No torrent client is set up and switched on',
      );
      expect(await aQueue().queue.send({ ...SEND, protocol: 'usenet' })).toBe(
        'No usenet client is set up and switched on',
      );
      expect(
        await aQueue({ clients: [aDownloadClient({ isEnabled: false })] }).queue.send({
          ...SEND,
          clientId: QBITTORRENT.id,
        }),
      ).toBe('That download client is not set up, or is switched off');
      expect(
        await aQueue().queue.send({ ...SEND, protocol: 'usenet', clientId: QBITTORRENT.id }),
      ).toBe('qBittorrent cannot take a usenet release');
    });

    it('says why the release could not be fetched', async () => {
      const failing = (error: Error) =>
        aQueue({ fetchRelease: () => Promise.reject(error) }).queue.send(SEND);

      expect(await failing(new IndexerFailure('The site answered 410'))).toBe(
        'The site answered 410',
      );
      expect(await failing(new Error('boom'))).toBe('The release could not be fetched');
      expect(await aQueue({ fetchRelease: () => Promise.resolve(null) }).queue.send(SEND)).toBe(
        'The indexer that found it is no longer set up',
      );
    });

    it('says why the client would not take it', async () => {
      const refusing = anAdapter();

      refusing.add.mockRejectedValueOnce(
        new DownloadClientFailure('qBittorrent would not take the torrent'),
      );
      refusing.add.mockRejectedValueOnce(new Error('boom'));

      const { queue } = aQueue({ adapter: refusing });

      expect(await queue.send(SEND)).toBe('qBittorrent would not take the torrent');
      expect(await queue.send(SEND)).toBe('The client could not be asked');
    });

    it('keeps one download for a release sent twice', async () => {
      const { queue, downloads, events } = aQueue();

      await queue.send(SEND);
      await queue.send(SEND);

      expect(await downloads.list()).toHaveLength(1);
      expect(await events.pending()).toHaveLength(1);
    });
  });

  describe('following', () => {
    it('reads each download as its client reports it, and how fast the client is going', async () => {
      const { queue, downloads } = aQueue({
        sent: [aSentDownload({ state: 'queued', progress: 0 })],
        adapter: anAdapter([anItem({ remoteId: HASH.toUpperCase() })]),
      });

      await queue.check();

      const read = await queue.queue();

      expect(read.clients).toEqual([
        {
          id: QBITTORRENT.id,
          name: 'qBittorrent',
          kind: 'qbittorrent',
          isEnabled: true,
          isReachable: true,
          problem: null,
          downloadBytesPerSecond: 900,
          uploadBytesPerSecond: 40,
          checkedAt: AT.toISOString(),
        },
      ]);
      expect(read.downloads[0]).toMatchObject({
        state: 'downloading',
        progress: 0.5,
        doneBytes: 500,
        downloadBytesPerSecond: 100,
        uploadBytesPerSecond: 5,
        secondsLeft: 5,
        seeds: 9,
        peers: 2,
      });
      expect(read.checkedAt).toBe(AT.toISOString());
      expect((await downloads.list())[0]?.state).toBe('downloading');
    });

    it('shows progress by the second, but keeps it only once it has moved a percent', async () => {
      const kept = aSentDownload({ progress: 0.5, updatedAt: '2026-09-18T00:00:00.000Z' });
      const { queue, downloads } = aQueue({
        sent: [kept],
        adapter: anAdapter([anItem({ progress: 0.505, doneBytes: 505 })]),
      });

      await queue.check();

      expect((await queue.queue()).downloads[0]?.progress).toBe(0.505);
      expect(await downloads.find(kept.id)).toEqual(kept);
    });

    it('keeps a new size, even without progress', async () => {
      const kept = aSentDownload({ sizeBytes: null });
      const { queue, downloads } = aQueue({ sent: [kept], adapter: anAdapter([anItem()]) });

      await queue.check();

      expect((await downloads.find(kept.id))?.sizeBytes).toBe(1000);
    });

    it('says once that a download failed, and why', async () => {
      const { queue, events } = aQueue({
        sent: [aSentDownload()],
        adapter: anAdapter([
          anItem({ state: 'failed', problem: 'qBittorrent cannot find its files' }),
        ]),
      });

      await queue.check();
      await queue.check();

      expect(await events.pending()).toEqual([
        expect.objectContaining({ kind: 'failed', problem: 'qBittorrent cannot find its files' }),
      ]);
    });

    it('gives a reason for a failure the client did not explain', async () => {
      const { queue, events } = aQueue({
        sent: [aSentDownload()],
        adapter: anAdapter([anItem({ state: 'failed', problem: null })]),
      });

      await queue.check();

      expect(await events.pending()).toMatchObject([{ problem: 'qBittorrent says it failed' }]);
    });

    it('notes when a download finished', async () => {
      const kept = aSentDownload();
      const { queue, downloads } = aQueue({
        sent: [kept],
        adapter: anAdapter([anItem({ state: 'done', progress: 1 })]),
      });

      await queue.check();

      expect(await downloads.find(kept.id)).toMatchObject({
        state: 'done',
        finishedAt: AT.toISOString(),
      });
    });

    it('keeps where its client put a download, once it says', async () => {
      const kept = aSentDownload();
      const { queue, downloads } = aQueue({
        sent: [kept],
        adapter: anAdapter([anItem({ path: '/downloads/valence/Dune' })]),
      });

      await queue.check();

      expect((await downloads.find(kept.id))?.contentPath).toBe('/downloads/valence/Dune');
    });

    it('fails a download taken out of its client before it finished, but not one that had', async () => {
      const unfinished = aSentDownload({ sentAt: '2026-09-18T23:58:00.000Z' });
      const finished = aSentDownload({
        id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
        remoteId: 'other',
        state: 'done',
      });
      const { queue, downloads, events } = aQueue({
        sent: [
          unfinished,
          finished,
          aSentDownload({
            id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
            remoteId: 'new',
            sentAt: AT.toISOString(),
          }),
        ],
      });

      await queue.check();

      expect(await downloads.find(unfinished.id)).toMatchObject({
        state: 'failed',
        problem: 'It is no longer in qBittorrent',
      });
      expect(await downloads.find(finished.id)).toEqual(finished);
      expect((await downloads.find('6ba7b819-9dad-11d1-80b4-00c04fd430c8'))?.state).toBe(
        'downloading',
      );
      expect(await events.pending()).toHaveLength(1);
    });

    it('says why a client could not be asked, and leaves its downloads be', async () => {
      const unreachable = anAdapter();

      unreachable.list.mockRejectedValueOnce(
        new DownloadClientFailure('qBittorrent could not be reached'),
      );
      unreachable.list.mockRejectedValueOnce(new Error('boom'));

      const kept = aSentDownload();
      const { queue, downloads } = aQueue({ sent: [kept], adapter: unreachable });

      await queue.check();

      expect((await queue.queue()).clients[0]).toMatchObject({
        isReachable: false,
        problem: 'qBittorrent could not be reached',
        downloadBytesPerSecond: null,
      });

      await queue.check();

      expect((await queue.queue()).clients[0]?.problem).toBe('The client could not be asked');
      expect(await downloads.find(kept.id)).toEqual(kept);
    });

    it('asks a switched-off client only while it still has downloads', async () => {
      const off = aDownloadClient({ isEnabled: false });
      const idle = aQueue({ clients: [off] });

      await idle.queue.check();

      expect(idle.adapter.list).not.toHaveBeenCalled();
      expect((await idle.queue.queue()).clients[0]?.checkedAt).toBeNull();

      const busy = aQueue({
        clients: [off],
        sent: [aSentDownload()],
        adapter: anAdapter([anItem()]),
      });

      await busy.queue.check();

      expect(busy.adapter.list).toHaveBeenCalled();
    });

    it('asks once for checks that overlap', async () => {
      const { queue, adapter } = aQueue({ sent: [aSentDownload()] });

      await Promise.all([queue.check(), queue.check()]);

      expect(adapter.list).toHaveBeenCalledTimes(1);
    });

    it('lists the newest downloads first, naming a client that has gone', async () => {
      const { queue } = aQueue({
        clients: [],
        sent: [
          aSentDownload({
            id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
            title: 'Old',
            sentAt: '2026-09-17T00:00:00.000Z',
          }),
          aSentDownload({ title: 'New' }),
        ],
      });

      const { downloads } = await queue.queue();

      expect(downloads.map((download) => download.title)).toEqual(['New', 'Old']);
      expect(downloads[0]?.clientName).toBe('A client that has gone');
      expect(downloads[0]?.downloadBytesPerSecond).toBeNull();
    });

    it('sorts clients by priority, then name', async () => {
      const { queue } = aQueue({
        clients: [
          aDownloadClient({ id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8', name: 'B' }),
          aDownloadClient({ id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8', name: 'A' }),
          aDownloadClient({ id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8', name: 'C', priority: 1 }),
        ],
      });

      expect((await queue.queue()).clients.map((client) => client.name)).toEqual(['C', 'A', 'B']);
    });
  });

  describe('acting on a download', () => {
    it('pauses and resumes a download in its client', async () => {
      const kept = aSentDownload();
      const { queue, adapter } = aQueue({
        sent: [kept],
        adapter: anAdapter([anItem({ state: 'paused' })]),
      });

      expect(await queue.pause(kept.id)).toMatchObject({ id: kept.id, state: 'paused' });
      expect(adapter.pause).toHaveBeenCalledWith(HASH);

      await queue.resume(kept.id);

      expect(adapter.resume).toHaveBeenCalledWith(HASH);
    });

    it('says why a client would not pause it, and knows nothing of a download it never sent', async () => {
      const refusing = anAdapter();

      refusing.pause.mockRejectedValueOnce(new DownloadClientFailure('qBittorrent answered 409'));
      refusing.pause.mockRejectedValueOnce(new Error('boom'));

      const kept = aSentDownload();
      const { queue } = aQueue({ sent: [kept], adapter: refusing });

      expect(await queue.pause(kept.id)).toBe('qBittorrent answered 409');
      expect(await queue.pause(kept.id)).toBe('The client could not be asked');
      expect(await queue.pause('nothing')).toBeNull();
    });

    it('knows nothing of a download whose client has gone', async () => {
      const { queue } = aQueue({ clients: [], sent: [aSentDownload()] });

      expect(await queue.resume(aSentDownload().id)).toBeNull();
    });

    it('says nothing where the download went while it was being paused', async () => {
      const kept = aSentDownload();
      const { queue, downloads, adapter } = aQueue({ sent: [kept] });

      adapter.pause.mockImplementationOnce(async () => {
        await downloads.remove(kept.id);
      });

      expect(await queue.pause(kept.id)).toBeNull();
    });

    it('removes a download from its client and from the queue', async () => {
      const kept = aSentDownload();
      const { queue, downloads, adapter } = aQueue({ sent: [kept] });

      expect(await queue.remove(kept.id, true)).toBe(true);
      expect(adapter.remove).toHaveBeenCalledWith(HASH, true);
      expect(await downloads.list()).toEqual([]);
      expect(await queue.remove(kept.id, false)).toBe(false);
    });

    it('keeps a download its client would not remove, saying why', async () => {
      const refusing = anAdapter();

      refusing.remove.mockRejectedValueOnce(
        new DownloadClientFailure('qBittorrent could not be reached'),
      );
      refusing.remove.mockRejectedValueOnce(new Error('boom'));

      const kept = aSentDownload();
      const { queue, downloads } = aQueue({ sent: [kept], adapter: refusing });

      expect(await queue.remove(kept.id, false)).toBe('qBittorrent could not be reached');
      expect(await queue.remove(kept.id, false)).toBe('The client could not be asked');
      expect(await downloads.list()).toEqual([kept]);
    });
  });

  describe('listening', () => {
    it('tells a listener the queue straight away, with any events not yet acknowledged', async () => {
      const { queue } = aQueue();

      await queue.send(SEND);
      await queue.check();

      const heard: DownloadStreamFrame[] = [];

      queue.listen((frame) => heard.push(frame));

      await vi.waitFor(() => {
        expect(heard.map((frame) => frame.kind)).toEqual(['queue', 'events']);
      });
    });

    it('tells a listener the queue after every check, until it stops listening', async () => {
      const { queue } = aQueue({ sent: [aSentDownload()], adapter: anAdapter([anItem()]) });
      const heard: DownloadStreamFrame[] = [];
      const stop = queue.listen((frame) => heard.push(frame));

      await vi.waitFor(() => {
        expect(heard).toHaveLength(1);
      });

      await queue.check();

      expect(heard).toHaveLength(2);

      stop();
      await queue.check();

      expect(heard).toHaveLength(2);
    });

    it('forgets events the server has acknowledged', async () => {
      const { queue, events } = aQueue();

      await queue.send(SEND);
      await queue.acknowledge([1]);

      expect(await events.pending()).toEqual([]);
    });

    it('stays quiet about events once they are acknowledged', async () => {
      const { queue } = aQueue();

      await queue.send(SEND);
      await queue.acknowledge([1]);

      const heard: DownloadStreamFrame[] = [];

      queue.listen((frame) => heard.push(frame));
      await queue.check();

      expect(heard.every((frame) => frame.kind === 'queue')).toBe(true);
    });
  });

  describe('pacing', () => {
    it('asks every half a minute until somebody watches, then every two seconds', async () => {
      const { queue, waits, adapter } = aQueue({ sent: [aSentDownload()] });

      queue.start();

      expect(waits.at(-1)?.afterMs).toBe(30_000);

      queue.watch(true);

      expect(waits.at(-2)?.isCancelled).toBe(true);
      expect(waits.at(-1)?.afterMs).toBe(2000);

      await vi.waitFor(() => {
        expect(adapter.list).toHaveBeenCalled();
      });

      queue.watch(false);

      expect(waits.at(-1)?.afterMs).toBe(30_000);
    });

    it('asks again when the wait is over, and waits again after', async () => {
      const { queue, waits, adapter } = aQueue({ sent: [aSentDownload()] });

      queue.start();
      await queue.check();
      adapter.list.mockClear();

      const count = waits.length;

      waits.at(-1)?.run();

      await vi.waitFor(() => {
        expect(waits.length).toBe(count + 1);
      });
      expect(adapter.list).toHaveBeenCalled();
    });

    it('slows down when the last listener goes', () => {
      const { queue, waits } = aQueue();

      queue.start();

      const stop = queue.listen(() => undefined);

      queue.watch(true);
      stop();

      expect(waits.at(-1)?.afterMs).toBe(30_000);
    });

    it('stops asking when stopped', () => {
      const { queue, waits } = aQueue();

      queue.start();
      queue.stop();

      expect(waits.at(-1)?.isCancelled).toBe(true);

      queue.watch(true);

      expect(waits.filter((wait) => !wait.isCancelled)).toEqual([]);
    });
  });
});
