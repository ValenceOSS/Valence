import type { HandOffDownload } from '@ValenceContracts/schemas/ArrApp';
import type { BlockedRelease, DownloadStopNext } from '@ValenceContracts/schemas/MediaRequest';
import type { Said } from '@ValenceI18n/SaidSchema';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrAppRecord, ArrAppStore } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { HandOffHandler } from '@ValenceRequests/arrApps/handOff/HandOffHandler';
import { handOffHandlerFor } from '@ValenceRequests/arrApps/handOff/handOffHandlerFor';
import { handOffDownloadOf } from '@ValenceRequests/arrApps/handOffDownloadOf';
import { isBlockForHandOff } from '@ValenceRequests/arrApps/isBlockForHandOff';
import { readArrQueue } from '@ValenceRequests/arrApps/readArrQueue';
import { ArrBlocklistPageSchema } from '@ValenceRequests/arrApps/schemas/ArrBlocklistPageSchema';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';

type CreateHandOffControlOptions = {
  requests: Pick<MediaRequestStore, 'find'>;
  items: Pick<RequestItemStore, 'list'>;
  apps: Pick<ArrAppStore, 'find'>;
  connect: (app: ArrAppRecord) => Pick<ArrCaller, 'read' | 'send' | 'remove'>;
  log: Pick<RequestLogStore, 'add'>;
  handlerFor?: (
    kind: ArrAppRecord['kind'],
    caller: Pick<ArrCaller, 'read' | 'send'>,
  ) => HandOffHandler | null;
};

type HandOffOutcome<Value> =
  | { kind: 'notHandedOff' }
  | { kind: 'failed'; problem: Said }
  | { kind: 'done'; value: Value };

type Reached = {
  request: MediaRequestRecord;
  items: RequestItemRecord[];
  app: ArrAppRecord;
  caller: Pick<ArrCaller, 'read' | 'send' | 'remove'>;
  handler: HandOffHandler;
  handOffId: number;
};

const BLOCKLIST_PAGE = '1000';

/**
 * Works the connected app a request was handed to from Valence, for an admin who chose to: its
 * downloads for the request and stopping one, its blocklist for it and lifting an entry, and which
 * of its films, episodes or albums it monitors, so following one in Valence follows it there too.
 *
 * @param options - The stores, the apps, and how to reach one.
 * @returns The control.
 */
const createHandOffControl = ({
  requests,
  items,
  apps,
  connect,
  log,
  handlerFor = handOffHandlerFor,
}: CreateHandOffControlOptions) => {
  const reach = async (id: string): Promise<Reached | null> => {
    const request = await requests.find(id);
    const handOff = request?.handOff ?? null;
    const app = handOff === null ? null : await apps.find(handOff.appId);

    if (request === null || app === null || !app.isEnabled || request.handOffId === null) {
      return null;
    }

    const caller = connect(app);
    const handler = handlerFor(app.kind, caller);

    return handler === null
      ? null
      : {
          request,
          items: (await items.list()).filter((item) => item.requestId === id),
          app,
          caller,
          handler,
          handOffId: request.handOffId,
        };
  };

  const working = async <Value>(
    id: string,
    work: (reached: Reached) => Promise<HandOffOutcome<Value>>,
  ): Promise<HandOffOutcome<Value>> => {
    const reached = await reach(id);

    if (reached === null) {
      return { kind: 'notHandedOff' };
    }

    try {
      return await work(reached);
    } catch (error) {
      if (!(error instanceof ArrAppFailure)) {
        throw error;
      }

      return {
        kind: 'failed',
        problem: saying('requests.arrApps.handOff.nameSaidProblem', {
          name: reached.app.name,
          problem: error.said,
        }),
      };
    }
  };

  const downloadsOf = async ({
    request,
    items: held,
    app,
    caller,
    handler,
    handOffId,
  }: Reached) => {
    const queued = await handler.queued(request, held, handOffId, await readArrQueue(caller));
    const grouped = new Map<string, HandOffDownload>();

    for (const { record, itemIds } of queued) {
      const key = record.downloadId ?? record.id.toString();
      const known = grouped.get(key);

      grouped.set(
        key,
        known === undefined
          ? handOffDownloadOf(record, itemIds, app.name)
          : { ...known, itemIds: [...new Set([...known.itemIds, ...itemIds])] },
      );
    }

    return [...grouped.values()];
  };

  const blocklistOf = async ({ request, app, caller, handOffId }: Reached) =>
    (
      await caller.read('/blocklist', ArrBlocklistPageSchema, {
        page: '1',
        pageSize: BLOCKLIST_PAGE,
      })
    ).records
      .filter((block) => isBlockForHandOff(block, app.kind, handOffId))
      .map((block): BlockedRelease => ({
        id: block.id.toString(),
        requestId: request.id,
        title: block.sourceTitle,
        indexerId: null,
        reason:
          block.message === null || block.message === undefined || block.message === ''
            ? saying('requests.arrApps.handOff.blockedInName', { name: app.name })
            : sayVerbatim(block.message),
        at: new Date(block.date ?? 0).toISOString(),
      }));

  const monitor = async (reached: Reached, itemIds: readonly string[], isMonitored: boolean) => {
    const { request, app, handler, handOffId } = reached;
    const chosen = reached.items.filter((item) => itemIds.includes(item.id));

    await handler.monitor(request, chosen, handOffId, isMonitored);
    await log.add(
      request.id,
      isMonitored
        ? saying('requests.arrApps.handOff.askedNameToMonitorIt', { name: app.name })
        : saying('requests.arrApps.handOff.askedNameToStopMonitoringIt', { name: app.name }),
      null,
    );

    if (isMonitored && request.handOff?.searchesOnAdd === true) {
      await handler.search(request, handOffId);
    }
  };

  return {
    downloads: (id: string): Promise<HandOffOutcome<HandOffDownload[]>> =>
      working(id, async (reached) => ({ kind: 'done', value: await downloadsOf(reached) })),

    stop: (
      id: string,
      downloadId: string,
      next: DownloadStopNext,
    ): Promise<HandOffOutcome<string[]>> =>
      working(id, async (reached) => {
        const download = (await downloadsOf(reached)).find((one) => one.id === downloadId);

        if (download === undefined) {
          return {
            kind: 'failed',
            problem: saying('requests.arrApps.handOff.thatIsNotOneOfItsDownloads'),
          };
        }

        await reached.caller.remove(`/queue/${download.id}`, {
          removeFromClient: 'true',
          blocklist: 'true',
          skipRedownload: next === 'another' ? 'false' : 'true',
        });
        await log.add(
          reached.request.id,
          saying('requests.arrApps.handOff.askedNameToStopTitle', {
            name: reached.app.name,
            title: download.releaseTitle,
          }),
          null,
        );

        if (next === 'nothing') {
          await monitor(reached, download.itemIds, false);
        }

        return { kind: 'done', value: download.itemIds };
      }),

    blocklist: (id: string): Promise<HandOffOutcome<BlockedRelease[]>> =>
      working(id, async (reached) => ({ kind: 'done', value: await blocklistOf(reached) })),

    lift: (id: string, blockId: string): Promise<HandOffOutcome<true>> =>
      working(id, async (reached) => {
        const block = (await blocklistOf(reached)).find((one) => one.id === blockId);

        if (block === undefined) {
          return {
            kind: 'failed',
            problem: saying('requests.arrApps.handOff.thatIsNotOnItsBlocklist'),
          };
        }

        await reached.caller.remove(`/blocklist/${block.id}`);
        await log.add(
          reached.request.id,
          saying('requests.arrApps.handOff.askedNameToTryTitleAgain', {
            name: reached.app.name,
            title: block.title,
          }),
          null,
        );

        return { kind: 'done', value: true };
      }),

    follow: (
      id: string,
      itemIds: readonly string[],
      isFollowed: boolean,
    ): Promise<HandOffOutcome<true>> =>
      working(id, async (reached) => {
        await monitor(reached, itemIds, isFollowed);

        return { kind: 'done', value: true };
      }),

    release: (id: string): Promise<HandOffOutcome<true>> =>
      working(id, async (reached) => {
        await monitor(
          reached,
          reached.items.map((item) => item.id),
          false,
        );

        return { kind: 'done', value: true };
      }),
  };
};

type HandOffControl = ReturnType<typeof createHandOffControl>;

export type { HandOffControl, HandOffOutcome };

export { createHandOffControl };
