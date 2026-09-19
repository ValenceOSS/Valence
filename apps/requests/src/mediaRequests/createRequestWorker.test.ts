import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryEventStore } from '@ValenceRequests/events/createMemoryEventStore';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { aSentDownload } from '@ValenceRequests/testing/aSentDownload';
import { createRequestWorker } from './createRequestWorker';
import type { Release, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { QueuedDownload, ReleaseSend } from '@ValenceContracts/schemas/DownloadQueue';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';
import type { BlockedReleaseRecord } from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { fileDownload } from './fileDownload';

const AT = new Date('2026-09-19T00:00:00.000Z');

const WEB = 'Dune.2021.1080p.WEB-DL.x264-GRP';

const BLURAY = 'Dune.2021.1080p.BluRay.x264-GRP';

const SEVERANCE = aMediaRequest({
  kind: 'series',
  tmdbId: 95396,
  title: 'Severance',
  year: 2022,
  libraryId: 'series',
  libraryPath: '/media/Series',
  runtimeMinutes: 55,
});

type HarnessOptions = {
  requests?: MediaRequestRecord[];
  items?: RequestItemRecord[];
  sent?: SentDownloadRecord[];
  blocked?: BlockedReleaseRecord[];
  found?: (search: ReleaseSearch) => Release[];
  profiles?: QualityProfile[];
  refuseSend?: string;
  filed?: typeof fileDownload;
  localPath?: string;
};

/**
 * A worker over stores in memory, indexers that find what they are told, and a queue that takes
 * whatever it is sent.
 */
const aWorker = ({
  requests = [aMediaRequest()],
  items = [aRequestItem()],
  sent = [],
  blocked = [],
  found = () => [aRelease(WEB), aRelease(BLURAY)],
  profiles = [],
  refuseSend,
  filed = vi.fn<typeof fileDownload>(() => Promise.resolve({ filed: new Map(), missing: [] })),
  localPath = '',
}: HarnessOptions = {}) => {
  const requestStore = createMemoryRecordStore(requests);
  const itemStore = createMemoryRecordStore(items);
  const blockedStore = createMemoryRecordStore(blocked);
  const downloads = createMemoryRecordStore(sent);
  const events = createMemoryEventStore(() => AT);
  const searched: ReleaseSearch[] = [];
  let sends = 0;
  const send = vi.fn((release: ReleaseSend): Promise<QueuedDownload | string> => {
    if (refuseSend !== undefined) {
      return Promise.resolve(refuseSend);
    }

    sends += 1;

    const record = aSentDownload({
      id: `3f2504e0-4f89-41d3-9a0c-${sends.toString().padStart(12, '0')}`,
      title: release.title,
      state: 'queued',
    });

    return downloads.insert(record).then(() => ({
      ...record,
      clientName: 'qBittorrent',
      downloadBytesPerSecond: null,
      uploadBytesPerSecond: null,
      secondsLeft: null,
      seeds: null,
      peers: null,
    }));
  });
  const remove = vi.fn(() => Promise.resolve(true));
  const scheduled: Array<{ run: () => void; afterMs: number }> = [];

  const worker = createRequestWorker({
    requests: requestStore,
    items: itemStore,
    blocked: blockedStore,
    downloads,
    clients: {
      records: () => Promise.resolve([aDownloadClient({ remotePath: '/downloads', localPath })]),
    },
    queue: { send, remove },
    indexers: {
      search: (search) => {
        const asked = { ...search };

        searched.push(asked);

        return Promise.resolve({
          releases: found(asked),
          indexers: [
            {
              indexerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              indexerName: 'Jackett',
              found: 2,
              tookMs: 10,
              problem: null,
            },
          ],
          judgements: [],
          pickedId: null,
        });
      },
      list: () => Promise.resolve([]),
    },
    profiles: { list: () => Promise.resolve(profiles) },
    events,
    file: filed,
    now: () => AT,
    schedule: (run, afterMs) => {
      const entry = { run, afterMs };

      scheduled.push(entry);

      return () => {
        scheduled.splice(scheduled.indexOf(entry), 1);
      };
    },
  });

  return {
    worker,
    items: itemStore,
    blocked: blockedStore,
    downloads,
    events,
    searched,
    send,
    remove,
    scheduled,
    filed,
    requests: requestStore,
  };
};

/**
 * The one film or episode a harness holds, as it is now.
 */
const theItem = async (store: ReturnType<typeof aWorker>['items']) => (await store.list())[0];

describe('createRequestWorker', () => {
  describe('releasing and searching', () => {
    it('searches for a film that is out, and sends the best release', async () => {
      const { worker, items, searched, send, events } = aWorker({
        profiles: [aProfile({ sources: ['bluray', 'webdl'], libraryIds: ['films'] })],
        items: [aRequestItem({ state: 'waiting' })],
      });

      await worker.tick();

      expect(searched).toEqual([{ query: 'Dune', mode: 'movie', tmdbId: 438631 }]);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ title: BLURAY, libraryKind: 'movies' }),
      );
      expect(await theItem(items)).toMatchObject({
        state: 'downloading',
        releaseTitle: BLURAY,
        lastSearchedAt: AT.toISOString(),
      });
      expect(await events.pending()).toMatchObject([
        { kind: 'chosen', title: 'Dune', releaseTitle: BLURAY, requestedById: 'someone' },
      ]);
    });

    it('holds a film that is not out yet, and episodes that have not aired', async () => {
      const { worker, items, searched } = aWorker({
        requests: [aMediaRequest(), SEVERANCE],
        items: [
          aRequestItem({ state: 'waiting', airDate: '2027-01-01' }),
          aRequestItem({
            id: 'episode',
            requestId: SEVERANCE.id,
            season: 3,
            episode: 1,
            state: 'waiting',
            airDate: null,
          }),
        ],
      });

      await worker.tick();

      expect(searched).toEqual([]);
      expect((await items.list()).map((item) => item.state)).toEqual(['waiting', 'waiting']);
    });

    it('lets go of a film the catalogue knows no date for', async () => {
      const { worker, searched } = aWorker({
        items: [aRequestItem({ state: 'waiting', airDate: null })],
      });

      await worker.tick();

      expect(searched).toHaveLength(1);
    });

    it('leaves a request waiting on approval alone', async () => {
      const { worker, searched } = aWorker({
        requests: [aMediaRequest({ approval: 'awaiting' })],
      });

      await worker.tick();

      expect(searched).toEqual([]);
    });

    it('keeps a film wanted when nothing acceptable is found, and searches again later', async () => {
      const { worker, items, searched } = aWorker({ found: () => [] });

      await worker.tick();
      await worker.tick();

      expect(await theItem(items)).toMatchObject({
        state: 'wanted',
        problem: 'Nothing acceptable has been found yet',
        lastSearchedAt: AT.toISOString(),
      });
      expect(searched).toHaveLength(1);

      expect(await worker.searchMissing()).toEqual({ searched: 1, startedAt: AT.toISOString() });
      expect(searched).toHaveLength(2);
    });

    it('searches by another title where the first finds nothing', async () => {
      const { worker, searched, send } = aWorker({
        requests: [aMediaRequest({ aliases: ['Dune Part One'] })],
        found: (search) =>
          search.query === 'Dune Part One'
            ? [aRelease('Dune.Part.One.2021.1080p.WEB-DL.x264-GRP')]
            : [],
      });

      await worker.tick();

      expect(searched.map((search) => search.query)).toEqual(['Dune', 'Dune Part One']);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('asks for an aired season whole, then each episode where no pack is found', async () => {
      const episodes = [1, 2].map((episode) =>
        aRequestItem({
          id: `e${episode.toString()}`,
          requestId: SEVERANCE.id,
          season: 1,
          episode,
          title: `Episode ${episode.toString()}`,
          airDate: '2022-02-18',
        }),
      );
      const { worker, searched, items } = aWorker({
        requests: [SEVERANCE],
        items: episodes,
        found: (search) =>
          search.episode === 1 ? [aRelease('Severance.S01E01.1080p.WEB-DL.x264-GRP')] : [],
      });

      await worker.tick();

      expect(searched.map(({ season, episode }) => [season, episode])).toEqual([
        [1, undefined],
        [1, 1],
        [1, 2],
      ]);
      expect((await items.list()).map((item) => item.state)).toEqual(['downloading', 'wanted']);
    });

    it('fetches a whole season pack for every episode it holds', async () => {
      const episodes = [1, 2].map((episode) =>
        aRequestItem({
          id: `e${episode.toString()}`,
          requestId: SEVERANCE.id,
          season: 1,
          episode,
          airDate: '2022-02-18',
        }),
      );
      const { worker, items, send } = aWorker({
        requests: [SEVERANCE],
        items: episodes,
        found: () => [aRelease('Severance.S01.1080p.WEB-DL.x264-GRP')],
      });

      await worker.tick();

      expect(send).toHaveBeenCalledWith(expect.objectContaining({ libraryKind: 'shows' }));
      expect((await items.list()).map((item) => item.downloadId)).toEqual([
        '3f2504e0-4f89-41d3-9a0c-000000000001',
        '3f2504e0-4f89-41d3-9a0c-000000000001',
      ]);
    });

    it('keeps a film wanted, saying why, when the client will not take it', async () => {
      const { worker, items } = aWorker({ refuseSend: 'No torrent client is set up' });

      await worker.tick();

      expect(await theItem(items)).toMatchObject({
        state: 'wanted',
        problem: 'No torrent client is set up',
      });
    });

    it('keeps a film wanted where the release has nothing to fetch it by', async () => {
      const { worker, send } = aWorker({
        found: () => [aRelease(WEB, { magnetUrl: null, downloadUrl: null })],
      });

      await worker.tick();

      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('following downloads', () => {
    it('files a finished download, from where the client put it, as this service sees it', async () => {
      const filed = vi.fn<typeof fileDownload>(() =>
        Promise.resolve({
          filed: new Map([[aRequestItem().id, '/media/Films/Dune (2021)/Dune (2021).mkv']]),
          missing: [],
        }),
      );
      const { worker, items, events } = aWorker({
        items: [
          aRequestItem({
            state: 'downloading',
            downloadId: aSentDownload().id,
            releaseTitle: BLURAY,
            score: 2200,
          }),
        ],
        sent: [aSentDownload({ state: 'done', contentPath: '/downloads/valence-films/Dune' })],
        filed,
        localPath: '/srv/downloads',
      });

      await worker.tick();

      expect(filed).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Dune' }),
        [expect.objectContaining({ state: 'filing' })],
        '/srv/downloads/valence-films/Dune',
        true,
      );
      expect(await theItem(items)).toMatchObject({
        state: 'filed',
        filePath: '/media/Films/Dune (2021)/Dune (2021).mkv',
        filedTitle: BLURAY,
        filedScore: 2200,
      });
      expect(await events.pending()).toMatchObject([
        {
          kind: 'filed',
          requestKind: 'film',
          tmdbId: 438631,
          libraryId: 'films',
          folder: '/media/Films/Dune (2021)',
        },
      ]);
    });

    it('waits while a download is under way', async () => {
      const { worker, items } = aWorker({
        items: [aRequestItem({ state: 'downloading', downloadId: aSentDownload().id })],
        sent: [aSentDownload()],
      });

      await worker.tick();

      expect((await theItem(items))?.state).toBe('downloading');
    });

    it('blocklists a failed release and fetches the next best at once', async () => {
      const { worker, items, blocked, remove, send } = aWorker({
        items: [
          aRequestItem({
            state: 'downloading',
            downloadId: aSentDownload().id,
            releaseTitle: BLURAY,
          }),
        ],
        sent: [aSentDownload({ title: BLURAY, state: 'failed', problem: 'The tracker is gone' })],
        found: () => [aRelease(BLURAY), aRelease(WEB)],
      });

      await worker.tick();

      expect(await blocked.list()).toMatchObject([
        { title: BLURAY, reason: 'The tracker is gone' },
      ]);
      expect(remove).toHaveBeenCalledWith(aSentDownload().id, true);
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ title: WEB }));
      expect((await theItem(items))?.releaseTitle).toBe(WEB);
    });

    it('gives up on a download that has stalled for hours', async () => {
      const { worker, blocked } = aWorker({
        items: [aRequestItem({ state: 'downloading', downloadId: aSentDownload().id })],
        sent: [aSentDownload({ state: 'stalled', updatedAt: '2026-09-18T12:00:00.000Z' })],
      });

      await worker.tick();

      expect((await blocked.list())[0]?.reason).toBe('It stalled, with nobody to fetch it from');
    });

    it('wants a film again whose download was taken out', async () => {
      const { worker, items, send } = aWorker({
        items: [aRequestItem({ state: 'downloading', downloadId: aSentDownload().id })],
      });

      await worker.tick();

      expect(send).toHaveBeenCalled();
      expect((await theItem(items))?.state).toBe('downloading');
    });

    it('tries filing again, then gives up and says so', async () => {
      const { worker, items, events } = aWorker({
        items: [aRequestItem({ state: 'filing', downloadId: aSentDownload().id })],
        sent: [aSentDownload({ state: 'done' })],
      });

      await worker.tick();

      expect(await theItem(items)).toMatchObject({
        state: 'filing',
        attempts: 1,
        problem: 'qBittorrent has not said where it put the download',
      });

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await worker.tick();
      }

      expect((await theItem(items))?.state).toBe('failed');
      expect(await events.pending()).toMatchObject([
        { kind: 'stuck', problem: 'qBittorrent has not said where it put the download' },
      ]);
    });

    it('says why filing failed', async () => {
      const { worker, items } = aWorker({
        items: [aRequestItem({ state: 'filing', downloadId: aSentDownload().id })],
        sent: [aSentDownload({ state: 'done', contentPath: '/downloads/Dune' })],
        filed: () => Promise.reject(new Error('EACCES: permission denied')),
      });

      await worker.tick();

      expect((await theItem(items))?.problem).toBe(
        'It could not be filed: EACCES: permission denied',
      );
    });

    it('blocklists a download that held nothing asked for', async () => {
      const { worker, blocked } = aWorker({
        items: [aRequestItem({ state: 'filing', downloadId: aSentDownload().id })],
        sent: [aSentDownload({ state: 'done', contentPath: '/downloads/Dune' })],
        filed: () => Promise.resolve({ filed: new Map(), missing: [aRequestItem().id] }),
        found: () => [],
      });

      await worker.tick();

      expect((await blocked.list())[0]?.reason).toBe('It held nothing asked for');
    });
  });

  describe('upgrading', () => {
    const UPGRADING = aProfile({
      isUpgrading: true,
      libraryIds: ['films'],
      sources: ['bluray', 'webdl'],
      upgradeUntilSource: 'bluray',
    });

    const HERE = aRequestItem({
      state: 'available',
      filePath: '/media/Films/Dune (2021)/Dune (2021).mkv',
      releaseTitle: WEB,
      score: 2100,
      filedTitle: WEB,
      filedScore: 2100,
    });

    it('fetches something better when the profile would still upgrade', async () => {
      const { worker, send } = aWorker({ items: [HERE], profiles: [UPGRADING] });

      await worker.searchMissing();

      expect(send).toHaveBeenCalledWith(expect.objectContaining({ title: BLURAY }));
    });

    it('leaves alone what is as good as the profile goes', async () => {
      const { worker, searched } = aWorker({
        items: [{ ...HERE, filedTitle: BLURAY, releaseTitle: BLURAY }],
        profiles: [UPGRADING],
      });

      await worker.searchMissing();

      expect(searched).toEqual([]);
    });

    it('goes back to what is here when an upgrade fails', async () => {
      const { worker, items } = aWorker({
        items: [
          {
            ...HERE,
            state: 'downloading',
            downloadId: aSentDownload().id,
            releaseTitle: BLURAY,
            score: 2200,
          },
        ],
        sent: [aSentDownload({ state: 'failed', problem: 'Gone' })],
        profiles: [UPGRADING],
      });

      await worker.tick();

      expect(await theItem(items)).toMatchObject({
        state: 'available',
        releaseTitle: WEB,
        score: 2100,
      });
    });
  });

  describe('reading the newest releases', () => {
    it('fetches a wanted film the moment it turns up', async () => {
      const { worker, searched, send } = aWorker({
        items: [aRequestItem({ lastSearchedAt: AT.toISOString() })],
      });

      await worker.pollFeeds();

      expect(searched).toEqual([{ query: '', mode: 'search' }]);
      expect(send).toHaveBeenCalled();
    });
  });

  describe('filing what was sent by hand', () => {
    const BY_HAND = aSentDownload({
      title: 'The.Matrix.1999.1080p.BrRip.x264-YIFY',
      state: 'done',
      contentPath: '/downloads/The Matrix (1999) [1080p]',
      libraryId: 'films',
      libraryPath: '/media/Films',
    });

    it('files a finished film into the library it was sent for, named from the release', async () => {
      const filed = vi.fn<typeof fileDownload>(() =>
        Promise.resolve({
          filed: new Map([['film', '/media/Films/The Matrix (1999)/The Matrix (1999).mp4']]),
          missing: [],
        }),
      );
      const { worker, downloads, events } = aWorker({
        requests: [],
        items: [],
        sent: [BY_HAND],
        filed,
        localPath: '/srv/downloads',
      });

      await worker.tick();

      expect(filed).toHaveBeenCalledWith(
        { libraryPath: '/media/Films', title: 'The Matrix', year: 1999 },
        [{ id: 'film', season: null, episode: null, title: '', airDate: null, filePath: null }],
        '/srv/downloads/The Matrix (1999) [1080p]',
        true,
      );
      expect((await downloads.find(BY_HAND.id))?.filedInto).toBe('/media/Films/The Matrix (1999)');
      expect(await events.pending()).toMatchObject([
        { kind: 'imported', libraryId: 'films', folder: '/media/Films/The Matrix (1999)' },
      ]);

      await worker.tick();

      expect(filed).toHaveBeenCalledTimes(1);
    });

    it('leaves alone what was fetched for a request, or for no library, or is not finished', async () => {
      const filed = vi.fn<typeof fileDownload>();
      const { worker } = aWorker({
        items: [aRequestItem({ state: 'downloading', downloadId: BY_HAND.id })],
        sent: [
          { ...BY_HAND, state: 'downloading' },
          { ...BY_HAND, id: '3f2504e0-4f89-41d3-9a0c-0305e82c3302', libraryPath: null },
          { ...BY_HAND, id: '3f2504e0-4f89-41d3-9a0c-0305e82c3303', libraryKind: 'music' },
        ],
        filed,
      });

      await worker.tick();

      expect(filed).not.toHaveBeenCalled();
    });

    it('says why a download sent by hand could not be filed, and gives up in the end', async () => {
      const { worker, downloads } = aWorker({
        requests: [],
        items: [],
        sent: [
          { ...BY_HAND, contentPath: null },
          { ...BY_HAND, id: '3f2504e0-4f89-41d3-9a0c-0305e82c3302', title: '' },
          { ...BY_HAND, id: '3f2504e0-4f89-41d3-9a0c-0305e82c3303' },
          { ...BY_HAND, id: '3f2504e0-4f89-41d3-9a0c-0305e82c3304', filingAttempts: 5 },
        ],
        filed: () => Promise.resolve({ filed: new Map(), missing: ['film'] }),
      });

      await worker.tick();

      expect(
        (await downloads.list()).map((one) => [one.filingProblem, one.filingAttempts]),
      ).toEqual([
        ['qBittorrent has not said where it put the download', 1],
        ['Its name does not say what it is', 1],
        ['No video in it could be filed', 1],
        [null, 5],
      ]);
    });

    it('says why filing failed', async () => {
      const { worker, downloads } = aWorker({
        requests: [],
        items: [],
        sent: [BY_HAND],
        filed: () => Promise.reject(new Error('EACCES')),
      });

      await worker.tick();

      expect((await downloads.find(BY_HAND.id))?.filingProblem).toBe(
        'It could not be filed: EACCES',
      );
    });

    it('says where to set the folder when the download cannot be seen', async () => {
      const { worker, downloads } = aWorker({
        requests: [],
        items: [],
        sent: [BY_HAND],
        filed: () => Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
      });

      await worker.tick();

      expect(await downloads.find(BY_HAND.id)).toMatchObject({
        filingProblem:
          'Valence cannot see /downloads/The Matrix (1999) [1080p], where qBittorrent put it. Set where qBittorrent saves downloads, as it sees them and as Valence does, on the Downloads page.',
        filingAttempts: 0,
      });
    });

    it('keeps trying to file for a request while its download cannot be seen', async () => {
      const { worker, items } = aWorker({
        items: [aRequestItem({ state: 'filing', downloadId: aSentDownload().id, attempts: 4 })],
        sent: [aSentDownload({ state: 'done', contentPath: '/downloads/Dune' })],
        filed: () => Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
      });

      await worker.tick();

      expect((await items.list())[0]).toMatchObject({ state: 'filing', attempts: 4 });
    });

    it('files a download now, into the library asked for, whenever it was sent', async () => {
      const filed = vi.fn<typeof fileDownload>(() =>
        Promise.resolve({ filed: new Map([['film', '/x']]), missing: [] }),
      );
      const { worker, downloads } = aWorker({
        requests: [],
        items: [],
        sent: [{ ...BY_HAND, libraryId: null, libraryPath: null, filingAttempts: 5 }],
        filed,
      });

      const now = await worker.fileNow(BY_HAND.id, { id: 'films', path: '/media/Films' });

      expect(now).toMatchObject({ filedInto: '/media/Films/The Matrix (1999)', filingAttempts: 0 });
      expect(await downloads.find(BY_HAND.id)).toMatchObject({ libraryId: 'films' });
      expect(await worker.fileNow('gone', { id: 'films', path: '/media/Films' })).toBeNull();
    });

    it('leaves a download fetched for a request to the request', async () => {
      const { worker } = aWorker({
        items: [aRequestItem({ state: 'downloading', downloadId: BY_HAND.id })],
        sent: [BY_HAND],
      });

      expect(await worker.fileNow(BY_HAND.id, { id: 'films', path: '/media/Films' })).toBe(
        'claimed',
      );
    });

    it('files the episodes a series download holds', async () => {
      const root = await mkdtemp(join(tmpdir(), 'valence-by-hand-'));
      const filed = vi.fn<typeof fileDownload>(() =>
        Promise.resolve({ filed: new Map([['1x2', '/x']]), missing: [] }),
      );

      await writeFile(join(root, 'Severance.S01E02.1080p.mkv'), 'two');

      const { worker } = aWorker({
        requests: [],
        items: [],
        sent: [
          {
            ...BY_HAND,
            title: 'Severance.S01E02.1080p.WEB-DL',
            libraryKind: 'shows',
            libraryPath: '/media/Series',
            contentPath: join(root, 'Severance.S01E02.1080p.mkv'),
          },
        ],
        filed,
      });

      await worker.tick();

      expect(filed.mock.calls[0]?.[1]).toEqual([
        { id: '1x2', season: 1, episode: 2, title: '', airDate: null, filePath: null },
      ]);
    });
  });

  describe('asking the indexers no more than it needs to', () => {
    it('reads no newest releases while nothing is wanted', async () => {
      const { worker, searched } = aWorker({ items: [aRequestItem({ state: 'downloading' })] });

      await worker.pollFeeds();

      expect(searched).toEqual([]);
    });

    it('searches each episode by its own title alone, once a season pack is not found', async () => {
      const episodes = [1, 2].map((episode) =>
        aRequestItem({
          id: `e${episode.toString()}`,
          requestId: SEVERANCE.id,
          season: 1,
          episode,
          airDate: '2022-02-18',
        }),
      );
      const { worker, searched } = aWorker({
        requests: [{ ...SEVERANCE, aliases: ['Separation'] }],
        items: episodes,
        found: () => [],
      });

      await worker.tick();

      expect(searched.map(({ query, episode }) => [query, episode])).toEqual([
        ['Severance', undefined],
        ['Separation', undefined],
        ['Severance', 1],
        ['Severance', 2],
      ]);
    });
  });

  describe('by hand', () => {
    it('lists the releases for a request, judged, with each indexer once', async () => {
      const { worker } = aWorker({
        requests: [SEVERANCE],
        items: [aRequestItem({ requestId: SEVERANCE.id, season: 1, episode: 1 })],
        found: () => [aRelease('Severance.S01E01.1080p.WEB-DL.x264-GRP')],
      });

      const outcome = await worker.releasesFor(SEVERANCE.id);

      expect(outcome?.releases.map((release) => release.title)).toEqual([
        'Severance.S01E01.1080p.WEB-DL.x264-GRP',
      ]);
      expect(outcome?.indexers).toMatchObject([{ found: 4 }]);
      expect(await worker.releasesFor('missing')).toBeNull();
    });

    it('sends the release an admin picked, whatever it is called', async () => {
      const { worker, send } = aWorker();

      const picked = await worker.pick(
        aMediaRequest().id,
        aRelease('Dune.Part.One.2021.2160p.WEB-DL.x265-GRP'),
      );

      expect(picked).toMatchObject({ state: 'downloading' });
      expect(send).toHaveBeenCalled();
      expect(await worker.pick('missing', aRelease(WEB))).toBeNull();
    });

    it('says why a pick cannot be sent', async () => {
      const busy = aWorker({ items: [aRequestItem({ state: 'downloading' })] });

      expect(await busy.worker.pick(aMediaRequest().id, aRelease(WEB))).toBe(
        'The film is on its way already',
      );

      const refused = aWorker({ refuseSend: 'No torrent client is set up' });

      expect(await refused.worker.pick(aMediaRequest().id, aRelease(WEB))).toBe(
        'No torrent client is set up',
      );

      const series = aWorker({
        requests: [SEVERANCE],
        items: [aRequestItem({ requestId: SEVERANCE.id, season: 1, episode: 1 })],
      });

      expect(await series.worker.pick(SEVERANCE.id, aRelease('Severance.S02E01.WEB'))).toBe(
        'That release holds no episode this request is waiting for',
      );
    });
  });

  describe('running', () => {
    it('picks up where it stopped, and keeps to its schedule until stopped', async () => {
      const { worker, items, scheduled } = aWorker({
        items: [aRequestItem({ state: 'searching', lastSearchedAt: AT.toISOString() })],
        found: () => [],
      });

      await worker.start();

      expect((await theItem(items))?.lastSearchedAt).toBeNull();
      expect(scheduled.map((entry) => entry.afterMs)).toEqual([0, 120_000, 900_000]);

      worker.nudge();
      worker.nudge();

      expect(scheduled).toHaveLength(4);

      worker.stop();

      expect(scheduled).toEqual([]);
    });

    it('runs again once each round is done', async () => {
      const { worker, scheduled } = aWorker({ found: () => [] });

      await worker.start();
      scheduled[0]?.run();
      await worker.tick();
      await vi.waitFor(() => {
        expect(scheduled.map((entry) => entry.afterMs)).toContain(30_000);
      });

      worker.stop();
    });
  });
});
