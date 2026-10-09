import { basename } from 'node:path';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import type { Fulfilment, HandedTo } from '@ValenceContracts/schemas/ArrApp';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrAppRecord, ArrAppStore } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { HandOffHandler, ItemSighting } from '@ValenceRequests/arrApps/handOff/HandOffHandler';
import { handOffHandlerFor } from '@ValenceRequests/arrApps/handOff/handOffHandlerFor';
import { problemOfQueueRecord } from '@ValenceRequests/arrApps/problemOfQueueRecord';
import { readArrQueue } from '@ValenceRequests/arrApps/readArrQueue';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import type { EventStore } from '@ValenceRequests/events/EventStore';
import { mapClientPath } from '@ValenceRequests/mediaRequests/mapClientPath';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';

type CreateHandOffWorkerOptions = {
  requests: MediaRequestStore;
  items: RequestItemStore;
  apps: Pick<ArrAppStore, 'find'>;
  connect: (app: ArrAppRecord) => Pick<ArrCaller, 'read' | 'send'>;
  events: EventStore;
  log: Pick<RequestLogStore, 'add'>;
  handlerFor?: (
    kind: ArrAppRecord['kind'],
    caller: Pick<ArrCaller, 'read' | 'send'>,
  ) => HandOffHandler | null;
  now?: () => Date;
  watchEveryMs?: number;
  print?: (line: string) => void;
};

type HandedOff = { request: MediaRequestRecord; items: RequestItemRecord[] };

type AppTrouble = { problem: Said; problemCode: ProblemCode | null };

const WATCH_EVERY_MS = 60_000;

const SETTLED = new Set<RequestItemRecord['state']>(['filed', 'available']);

/**
 * Whether a film or an episode is out, as the request worker judges it: a film by the day its
 * profile holds it until, and an episode by the day it airs, an episode with no day being not out.
 *
 * @param item - The film or episode.
 * @param today - Today's calendar date.
 * @returns Whether it is out.
 */
const isOut = (item: RequestItemRecord, today: string): boolean =>
  item.airDate === null ? item.season === null : item.airDate <= today;

/**
 * How much of a queued download is done, where the app says how big it is and how much is left.
 *
 * @param record - The queue record.
 * @returns The bytes done, or null.
 */
const doneBytesOf = (record: ArrQueueRecord): number | null =>
  record.size === null ||
  record.size === undefined ||
  record.sizeleft === null ||
  record.sizeleft === undefined
    ? null
    : Math.max(0, record.size - record.sizeleft);

/**
 * Follows the requests whose library hands them to Radarr, Sonarr or Lidarr: adding each to its app
 * once it is approved, and from then on reading what the app has done, so its films, episodes and
 * albums move from wanted to downloading to filed with the events the server already acts on — a
 * filed one tells the server which folder to read, as Valence's own filing does — while the app
 * alone searches, downloads and imports.
 *
 * Searching for one now, as Search missing does, asks its app to search for what it monitors of it
 * again; and each says which app has it, with a link to its page there.
 *
 * An app that cannot be reached is asked once a round: its other requests are given the same
 * problem without waiting on it again, so one app that is down does not hold up every request
 * behind it.
 *
 * @param requests - Where requests are kept.
 * @param items - Where what each waits for is kept.
 * @param apps - The connected apps.
 * @param connect - How to ask an app.
 * @param events - Where events wait for the server.
 * @param log - Where what each request did is kept.
 * @param handlerFor - How each kind of app is handed a request.
 * @param now - The clock.
 * @param watchEveryMs - How often to read what the apps have done.
 * @param print - Where to write what happened.
 * @returns The worker, whose step is run with every round of the request worker.
 */
const createHandOffWorker = ({
  requests,
  items,
  apps,
  connect,
  events,
  log,
  handlerFor = handOffHandlerFor,
  now = () => new Date(),
  watchEveryMs = WATCH_EVERY_MS,
  print = () => undefined,
}: CreateHandOffWorkerOptions) => {
  let lastWatchedAt = Number.NEGATIVE_INFINITY;

  const at = () => now().toISOString();

  const note = async (request: MediaRequestRecord, message: Said, code: ProblemCode | null) => {
    await log.add(request.id, message, code);
    print(`${request.title}: ${message.message}`);
  };

  const trouble = async (
    request: MediaRequestRecord,
    problem: Said,
    problemCode: ProblemCode | null = null,
  ) => {
    if (request.problem?.message !== problem.message) {
      await note(request, problem, problemCode);
    }

    await requests.update(request.id, { problem, problemCode, updatedAt: at() });
  };

  const change = (item: RequestItemRecord, changes: Partial<Omit<RequestItemRecord, 'id'>>) =>
    JSON.stringify({ ...item, ...changes }) === JSON.stringify(item)
      ? null
      : items.update(item.id, { ...changes, updatedAt: at() });

  const apply = async (
    { request, items: mine }: HandedOff,
    sightings: readonly ItemSighting[],
    app: ArrAppRecord,
  ) => {
    const today = at().slice(0, 10);
    const filed: { item: RequestItemRecord; folder: string }[] = [];
    let isStarted = false;
    let failure: Said | null = null;

    for (const sighting of sightings) {
      const item = mine.find((one) => one.id === sighting.itemId);

      if (item === undefined || SETTLED.has(item.state) || sighting.kind === 'unchanged') {
        continue;
      }

      if (sighting.kind === 'imported') {
        const filePath = mapClientPath(sighting.path, app);

        await change(item, {
          state: 'filed',
          problem: null,
          problemCode: null,
          filePath,
          filedTitle: basename(filePath),
        });
        filed.push({ item, folder: mapClientPath(sighting.folder, app) });
        continue;
      }

      if (sighting.kind === 'queued') {
        const { record } = sighting;
        const problem = problemOfQueueRecord(record);

        isStarted ||= item.state !== 'downloading';
        failure = problem !== null && item.problem?.message !== problem.message ? problem : failure;

        await change(item, {
          state: 'downloading',
          problem,
          problemCode: null,
          releaseTitle: record.title,
          downloadedBytes: doneBytesOf(record),
        });
        continue;
      }

      await change(item, {
        state: isOut(item, today) ? 'wanted' : 'waiting',
        problem: null,
        problemCode: null,
        ...(item.state === 'downloading' ? { releaseTitle: null, downloadedBytes: null } : {}),
      });
    }

    const queued = sightings.find((one) => one.kind === 'queued');

    if (isStarted && queued?.kind === 'queued') {
      await events.add({
        kind: 'chosen',
        title: request.title,
        requestId: request.id,
        requestedById: request.requestedById,
        releaseTitle: queued.record.title,
      });
      await events.add({ kind: 'started', title: request.title, clientName: app.name });
      await note(
        request,
        saying('requests.arrApps.handOff.nameIsDownloadingTitle', {
          name: app.name,
          title: queued.record.title,
        }),
        null,
      );
    }

    if (failure !== null) {
      await events.add({
        kind: 'failed',
        title: request.title,
        clientName: app.name,
        problem: failure,
      });
    }

    await fileEvents(request, filed, app);
  };

  const fileEvents = async (
    request: MediaRequestRecord,
    filed: readonly { item: RequestItemRecord; folder: string }[],
    app: ArrAppRecord,
  ) => {
    const isMusic = request.kind === 'artist' || request.kind === 'album';
    const told = isMusic ? filed : filed.slice(0, 1);

    for (const { item, folder } of told) {
      await events.add({
        kind: 'filed',
        title: request.title,
        requestId: request.id,
        requestedById: request.requestedById,
        requestKind: request.kind,
        tmdbId: request.tmdbId,
        musicBrainzId: isMusic ? item.musicBrainzId : null,
        libraryId: request.libraryId,
        folder,
      });
    }

    if (filed.length > 0) {
      await note(
        request,
        saying('requests.arrApps.handOff.nameImportedItIntoFolder', {
          name: app.name,
          folder: filed[0]?.folder ?? '',
        }),
        null,
      );
    }
  };

  const handOver = async (
    handedOff: HandedOff,
    handOff: Fulfilment,
    queueOf: (app: ArrAppRecord, caller: Pick<ArrCaller, 'read'>) => Promise<ArrQueueRecord[]>,
    down: Map<string, AppTrouble>,
  ) => {
    const { request } = handedOff;
    const app = await apps.find(handOff.appId);

    if (app === null) {
      await trouble(request, saying('requests.arrApps.handOff.theAppItWasHandedToIsGone'));

      return;
    }

    const caller = connect(app);
    const handler = app.isEnabled ? handlerFor(app.kind, caller) : null;

    if (handler === null) {
      await trouble(
        request,
        saying('requests.arrApps.handOff.nameIsSwitchedOffOrCannotTakeRequests', {
          name: app.name,
        }),
      );

      return;
    }

    try {
      let handOffId = request.handOffId;

      if (handOffId === null) {
        handOffId = await handler.place(request, handedOff.items, handOff);
        await requests.update(request.id, { handOffId, updatedAt: at() });
        await note(
          request,
          saying('requests.arrApps.handOff.handedToName', { name: app.name }),
          null,
        );
      }

      await apply(
        handedOff,
        await handler.watch(
          request,
          handedOff.items,
          handOff,
          handOffId,
          await queueOf(app, caller),
        ),
        app,
      );

      if (request.problem !== null) {
        await requests.update(request.id, { problem: null, problemCode: null, updatedAt: at() });
      }
    } catch (error) {
      if (!(error instanceof ArrAppFailure)) {
        throw error;
      }

      if (error.status === 404 && request.handOffId !== null) {
        await requests.update(request.id, { handOffId: null, updatedAt: at() });
      }

      const problem = saying('requests.arrApps.handOff.nameSaidProblem', {
        name: app.name,
        problem: error.said,
      });

      if (error.problemCode === 'ArrAppUnreachable') {
        down.set(app.id, { problem, problemCode: error.problemCode });
      }

      await trouble(request, problem, error.problemCode);
    }
  };

  return {
    searchNow: async (id: string): Promise<boolean> => {
      const request = await requests.find(id);
      const handOff = request?.handOff ?? null;

      if (request === null || handOff === null || request.handOffId === null) {
        return false;
      }

      const app = await apps.find(handOff.appId);
      const handler = app?.isEnabled === true ? handlerFor(app.kind, connect(app)) : null;

      if (app === null || handler === null) {
        return false;
      }

      try {
        await handler.search(request, request.handOffId);
        await note(
          request,
          saying('requests.arrApps.handOff.askedNameToSearchAgain', { name: app.name }),
          null,
        );

        return true;
      } catch (error) {
        if (!(error instanceof ArrAppFailure)) {
          throw error;
        }

        await trouble(
          request,
          saying('requests.arrApps.handOff.nameSaidProblem', {
            name: app.name,
            problem: error.said,
          }),
          error.problemCode,
        );

        return false;
      }
    },

    handedTo: async (id: string): Promise<HandedTo | null> => {
      const request = await requests.find(id);
      const handOff = request?.handOff ?? null;
      const app = handOff === null ? null : await apps.find(handOff.appId);

      if (request === null || app === null) {
        return null;
      }

      const handler = handlerFor(app.kind, connect(app));
      const page =
        handler === null || request.handOffId === null
          ? null
          : await handler.pageOf(request, request.handOffId).catch(() => null);

      return {
        appId: app.id,
        appName: app.name,
        appKind: app.kind,
        link: page === null ? null : `${app.url.replace(/\/+$/, '')}${page}`,
      };
    },

    step: async (): Promise<void> => {
      const [kept, all] = await Promise.all([requests.list(), items.list()]);
      const isWatching = now().getTime() - lastWatchedAt >= watchEveryMs;
      const queues = new Map<string, Promise<ArrQueueRecord[]>>();
      const down = new Map<string, AppTrouble>();

      const queueOf = (app: ArrAppRecord, caller: Pick<ArrCaller, 'read'>) => {
        const known = queues.get(app.id) ?? readArrQueue(caller);

        queues.set(app.id, known);

        return known;
      };

      if (isWatching) {
        lastWatchedAt = now().getTime();
      }

      for (const request of kept) {
        const { handOff } = request;

        if (
          handOff === null ||
          request.approval !== 'approved' ||
          (request.handOffId !== null && !isWatching)
        ) {
          continue;
        }

        const isDown = down.get(handOff.appId);

        if (isDown !== undefined) {
          await trouble(request, isDown.problem, isDown.problemCode);
          continue;
        }

        await handOver(
          { request, items: all.filter((item) => item.requestId === request.id) },
          handOff,
          queueOf,
          down,
        );
      }
    },
  };
};

type HandOffWorker = ReturnType<typeof createHandOffWorker>;

export type { HandOffWorker };

export { createHandOffWorker };
