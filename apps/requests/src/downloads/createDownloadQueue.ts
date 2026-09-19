import { randomUUID } from 'node:crypto';
import { PROTOCOL_OF_CLIENT } from '@ValenceContracts/schemas/DownloadClient';
import { ReleaseSendSchema } from '@ValenceContracts/schemas/DownloadQueue';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { waitThenRun } from '@ValenceRequests/timing/waitThenRun';
import type {
  DownloadQueue,
  DownloadStreamFrame,
  QueuedDownload,
  ReleaseSend,
} from '@ValenceContracts/schemas/DownloadQueue';
import type { ClientItem } from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { EventStore } from '@ValenceRequests/events/EventStore';
import type {
  SentDownloadRecord,
  SentDownloadStore,
} from '@ValenceRequests/downloads/SentDownloadRecord';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import type { Schedule } from '@ValenceRequests/timing/Schedule';

type CreateDownloadQueueOptions = {
  clients: Pick<DownloadClientService, 'records' | 'adapterOf'>;
  downloads: SentDownloadStore;
  events: EventStore;
  fetchRelease: (indexerId: string, url: string) => Promise<ReleaseFile | null>;
  now?: () => Date;
  schedule?: Schedule;
  watchedEveryMs?: number;
  idleEveryMs?: number;
};

type Live = Pick<
  ClientItem,
  | 'progress'
  | 'doneBytes'
  | 'downloadBytesPerSecond'
  | 'uploadBytesPerSecond'
  | 'secondsLeft'
  | 'seeds'
  | 'peers'
>;

type ClientReading = {
  isReachable: boolean;
  problem: string | null;
  downloadBytesPerSecond: number | null;
  uploadBytesPerSecond: number | null;
  checkedAt: string;
};

const WATCHED_EVERY_MS = 2000;

const IDLE_EVERY_MS = 30_000;

const UNASKABLE = 'The client could not be asked';

const PROGRESS_WORTH_KEEPING = 0.01;

const MISSING_AFTER_MS = 60_000;

const NOTHING_LIVE: Omit<Live, 'progress' | 'doneBytes'> = {
  downloadBytesPerSecond: null,
  uploadBytesPerSecond: null,
  secondsLeft: null,
  seeds: null,
  peers: null,
};

/**
 * The queue of everything Valence has handed to a download client: sending a release to the right
 * client, under the client's category for the kind of library it is for, following each download as
 * its client reports it, and pausing, resuming or removing it.
 *
 * Download clients cannot say when something changes, so each is asked in turn — every couple of
 * seconds while somebody is watching, and every half a minute otherwise, which is only to notice a
 * download finishing or failing. Whatever is listening hears the whole queue after every round, and
 * any events it has not yet acknowledged with it.
 *
 * What changes by the second — speed, time left, peers — is held in memory, and what matters after
 * a restart is kept: the state, why it failed, and progress once it has moved on by a percent.
 *
 * A download that disappears from its client before it finished counts as failed, since whatever
 * took it out, it will not finish now — once it has had a minute to appear, since a client can take
 * a moment to list something it has just been given.
 *
 * @param clients - The download clients, and how to speak to each.
 * @param downloads - Where what was sent is kept.
 * @param events - Where events wait for the server.
 * @param fetchRelease - How to fetch a release from the indexer that found it.
 * @param now - The clock.
 * @param schedule - How to wait before asking again.
 * @param watchedEveryMs - How often to ask while somebody watches.
 * @param idleEveryMs - How often to ask otherwise.
 * @returns The queue.
 */
const createDownloadQueue = ({
  clients,
  downloads,
  events,
  fetchRelease,
  now = () => new Date(),
  schedule = waitThenRun,
  watchedEveryMs = WATCHED_EVERY_MS,
  idleEveryMs = IDLE_EVERY_MS,
}: CreateDownloadQueueOptions) => {
  const live = new Map<string, Live>();
  const readings = new Map<string, ClientReading>();
  const listeners = new Set<(frame: DownloadStreamFrame) => void>();
  let checkedAt: string | null = null;
  let checking: Promise<void> | null = null;
  let isWatched = false;
  let isRunning = false;
  let cancel: (() => void) | null = null;

  const shown = (
    record: SentDownloadRecord,
    named: ReadonlyMap<string, DownloadClientRecord>,
  ): QueuedDownload => {
    const current = live.get(record.id) ?? {
      ...NOTHING_LIVE,
      progress: record.progress,
      doneBytes: record.doneBytes,
    };

    return {
      id: record.id,
      clientId: record.clientId,
      clientName: named.get(record.clientId)?.name ?? 'A client that has gone',
      protocol: record.protocol,
      libraryKind: record.libraryKind,
      title: record.title,
      indexerName: record.indexerName,
      state: record.state,
      problem: record.problem,
      ...current,
      sizeBytes: record.sizeBytes,
      sentAt: record.sentAt,
      finishedAt: record.finishedAt,
      filedInto: record.filedInto,
      filingProblem: record.filingProblem,
    };
  };

  const queue = async (): Promise<DownloadQueue> => {
    const [kept, sent] = await Promise.all([clients.records(), downloads.list()]);
    const named = new Map(kept.map((client) => [client.id, client]));

    return {
      clients: kept
        .toSorted(
          (left, right) => left.priority - right.priority || left.name.localeCompare(right.name),
        )
        .map((client) => {
          const reading = readings.get(client.id);

          return {
            id: client.id,
            name: client.name,
            kind: client.kind,
            isEnabled: client.isEnabled,
            isReachable: reading?.isReachable ?? false,
            problem: reading?.problem ?? null,
            downloadBytesPerSecond: reading?.downloadBytesPerSecond ?? null,
            uploadBytesPerSecond: reading?.uploadBytesPerSecond ?? null,
            checkedAt: reading?.checkedAt ?? null,
          };
        }),
      downloads: sent
        .toSorted((left, right) => right.sentAt.localeCompare(left.sentAt))
        .map((record) => shown(record, named)),
      checkedAt,
    };
  };

  const announce = async (): Promise<void> => {
    if (listeners.size === 0) {
      return;
    }

    const frame: DownloadStreamFrame = { kind: 'queue', queue: await queue() };
    const pending = await events.pending();

    for (const listener of listeners) {
      listener(frame);

      if (pending.length > 0) {
        listener({ kind: 'events', events: pending });
      }
    }
  };

  const follow = async (
    record: SentDownloadRecord,
    item: ClientItem | null,
    clientName: string,
  ): Promise<void> => {
    const at = now().toISOString();

    if (item === null) {
      live.delete(record.id);

      const isJustSent = now().getTime() - Date.parse(record.sentAt) < MISSING_AFTER_MS;

      if (record.state === 'done' || record.state === 'failed' || isJustSent) {
        return;
      }
    } else {
      live.set(record.id, {
        progress: item.progress,
        doneBytes: item.doneBytes,
        downloadBytesPerSecond: item.downloadBytesPerSecond,
        uploadBytesPerSecond: item.uploadBytesPerSecond,
        secondsLeft: item.secondsLeft,
        seeds: item.seeds,
        peers: item.peers,
      });
    }

    const next =
      item === null
        ? { state: 'failed' as const, problem: `It is no longer in ${clientName}` }
        : {
            state: item.state,
            problem: item.problem,
            progress: item.progress,
            doneBytes: item.doneBytes,
            sizeBytes: item.sizeBytes ?? record.sizeBytes,
            contentPath: item.path ?? record.contentPath,
          };
    const hasMoved =
      'progress' in next &&
      (Math.abs(next.progress - record.progress) >= PROGRESS_WORTH_KEEPING ||
        next.sizeBytes !== record.sizeBytes ||
        next.contentPath !== record.contentPath);

    if (next.state === record.state && next.problem === record.problem && !hasMoved) {
      return;
    }

    await downloads.update(record.id, {
      ...next,
      ...(next.state === 'done' && record.finishedAt === null ? { finishedAt: at } : {}),
      updatedAt: at,
    });

    if (next.state === 'failed' && record.state !== 'failed') {
      await events.add({
        kind: 'failed',
        title: record.title,
        clientName,
        problem: next.problem ?? `${clientName} says it failed`,
      });
    }
  };

  const round = async (): Promise<void> => {
    const [kept, sent] = await Promise.all([clients.records(), downloads.list()]);

    await Promise.all(
      kept
        .filter(
          (client) => client.isEnabled || sent.some((record) => record.clientId === client.id),
        )
        .map(async (client) => {
          const at = now().toISOString();
          const adapter = clients.adapterOf(client);

          try {
            const [items, speeds] = await Promise.all([adapter.list(), adapter.speeds()]);
            const byId = new Map(items.map((item) => [item.remoteId.toLowerCase(), item]));

            readings.set(client.id, { isReachable: true, problem: null, ...speeds, checkedAt: at });

            for (const record of sent.filter((one) => one.clientId === client.id)) {
              await follow(record, byId.get(record.remoteId.toLowerCase()) ?? null, client.name);
            }
          } catch (error) {
            readings.set(client.id, {
              isReachable: false,
              problem: error instanceof DownloadClientFailure ? error.message : UNASKABLE,
              downloadBytesPerSecond: null,
              uploadBytesPerSecond: null,
              checkedAt: at,
            });
          }
        }),
    );

    checkedAt = now().toISOString();

    await announce();
  };

  const check = (): Promise<void> => {
    checking ??= round().finally(() => {
      checking = null;
    });

    return checking;
  };

  const reschedule = (): void => {
    cancel?.();
    cancel = isRunning
      ? schedule(
          () => {
            void check().finally(reschedule);
          },
          isWatched ? watchedEveryMs : idleEveryMs,
        )
      : null;
  };

  const find = async (id: string) => {
    const record = await downloads.find(id);
    const client =
      record === null
        ? undefined
        : (await clients.records()).find((one) => one.id === record.clientId);

    return record === null || client === undefined ? null : { record, client };
  };

  const act = async (
    id: string,
    what: (found: { record: SentDownloadRecord; client: DownloadClientRecord }) => Promise<void>,
  ): Promise<QueuedDownload | string | null> => {
    const found = await find(id);

    if (found === null) {
      return null;
    }

    try {
      await what(found);
    } catch (error) {
      return error instanceof DownloadClientFailure ? error.message : UNASKABLE;
    }

    await check();

    const record = await downloads.find(id);

    return record === null ? null : shown(record, new Map([[found.client.id, found.client]]));
  };

  return {
    queue,

    check,

    send: async (release: ReleaseSend): Promise<QueuedDownload | string> => {
      const read = ReleaseSendSchema.parse(release);
      const kept = await clients.records();
      const client =
        read.clientId === undefined
          ? kept
              .filter((one) => one.isEnabled && PROTOCOL_OF_CLIENT[one.kind] === read.protocol)
              .toSorted((left, right) => left.priority - right.priority)[0]
          : kept.find((one) => one.id === read.clientId && one.isEnabled);

      if (client === undefined) {
        return read.clientId === undefined
          ? `No ${read.protocol === 'torrent' ? 'torrent' : 'usenet'} client is set up and switched on`
          : 'That download client is not set up, or is switched off';
      }

      if (PROTOCOL_OF_CLIENT[client.kind] !== read.protocol) {
        return `${client.name} cannot take a ${read.protocol} release`;
      }

      let file: ReleaseFile | null;

      try {
        file = read.url.startsWith('magnet:')
          ? { kind: 'magnet', url: read.url }
          : await fetchRelease(read.indexerId, read.url);
      } catch (error) {
        return error instanceof IndexerFailure ? error.message : 'The release could not be fetched';
      }

      if (file === null) {
        return 'The indexer that found it is no longer set up';
      }

      let remoteId: string;

      try {
        remoteId = await clients
          .adapterOf(client)
          .add(file, read.title, client.categories[read.libraryKind]);
      } catch (error) {
        return error instanceof DownloadClientFailure ? error.message : UNASKABLE;
      }

      const at = now().toISOString();
      const already = (await downloads.list()).find(
        (record) => record.clientId === client.id && record.remoteId === remoteId,
      );
      const refiled =
        already === undefined || read.library === null || already.filedInto !== null
          ? already
          : ((await downloads.update(already.id, {
              libraryId: read.library.id,
              libraryPath: read.library.path,
              filingProblem: null,
              filingAttempts: 0,
              updatedAt: at,
            })) ?? already);
      const record =
        refiled ??
        (await downloads.insert({
          id: randomUUID(),
          clientId: client.id,
          remoteId,
          contentPath: null,
          libraryId: read.library?.id ?? null,
          libraryPath: read.library?.path ?? null,
          filedInto: null,
          filingProblem: null,
          filingAttempts: 0,
          protocol: read.protocol,
          libraryKind: read.libraryKind,
          title: read.title,
          indexerName: read.indexerName,
          state: 'queued',
          problem: null,
          progress: 0,
          sizeBytes: read.sizeBytes,
          doneBytes: null,
          sentAt: at,
          finishedAt: null,
          updatedAt: at,
        }));

      if (already === undefined) {
        await events.add({
          kind: 'started',
          title: read.title,
          clientName: client.name,
        });
      }

      void check();

      return shown(record, new Map([[client.id, client]]));
    },

    pause: (id: string) =>
      act(id, ({ record, client }) => clients.adapterOf(client).pause(record.remoteId)),

    resume: (id: string) =>
      act(id, ({ record, client }) => clients.adapterOf(client).resume(record.remoteId)),

    remove: async (id: string, deleteData: boolean): Promise<boolean | string> => {
      const found = await find(id);

      if (found === null) {
        return false;
      }

      try {
        await clients.adapterOf(found.client).remove(found.record.remoteId, deleteData);
      } catch (error) {
        return error instanceof DownloadClientFailure ? error.message : UNASKABLE;
      }

      live.delete(id);
      await downloads.remove(id);
      await announce();

      return true;
    },

    watch: (watching: boolean): void => {
      const isNewlyWatched = watching && !isWatched;

      isWatched = watching;
      reschedule();

      if (isNewlyWatched) {
        void check();
      }
    },

    listen: (listener: (frame: DownloadStreamFrame) => void): (() => void) => {
      listeners.add(listener);

      void (async () => {
        listener({ kind: 'queue', queue: await queue() });

        const pending = await events.pending();

        if (pending.length > 0) {
          listener({ kind: 'events', events: pending });
        }
      })();

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0 && isWatched) {
          isWatched = false;
          reschedule();
        }
      };
    },

    acknowledge: (ids: readonly number[]): Promise<void> => events.acknowledge(ids),

    start: (): void => {
      isRunning = true;
      reschedule();
      void check();
    },

    stop: (): void => {
      isRunning = false;
      reschedule();
    },
  };
};

type DownloadQueueService = ReturnType<typeof createDownloadQueue>;

export type { DownloadQueueService };

export { createDownloadQueue };
