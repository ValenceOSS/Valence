import { randomUUID } from 'node:crypto';
import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import { fileDownload } from '@ValenceRequests/mediaRequests/fileDownload';
import { judgeForRequest } from '@ValenceRequests/mediaRequests/judgeForRequest';
import { libraryFolderOf } from '@ValenceRequests/mediaRequests/libraryFolderOf';
import { mapClientPath } from '@ValenceRequests/mediaRequests/mapClientPath';
import { planSearches } from '@ValenceRequests/mediaRequests/planSearches';
import { showMediaRequest } from '@ValenceRequests/mediaRequests/showMediaRequest';
import { wantsUpgrade } from '@ValenceRequests/mediaRequests/wantsUpgrade';
import { waitThenRun } from '@ValenceRequests/timing/waitThenRun';
import type {
  IndexerSearchReport,
  Release,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type { MediaRequest, MissingSearch } from '@ValenceContracts/schemas/MediaRequest';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { DownloadQueueService } from '@ValenceRequests/downloads/createDownloadQueue';
import type { SentDownloadStore } from '@ValenceRequests/downloads/SentDownloadRecord';
import type { EventStore } from '@ValenceRequests/events/EventStore';
import type { IndexerService } from '@ValenceRequests/indexers/createIndexerService';
import type { BlockedReleaseStore } from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';
import type { Schedule } from '@ValenceRequests/timing/Schedule';

type CreateRequestWorkerOptions = {
  requests: MediaRequestStore;
  items: RequestItemStore;
  blocked: BlockedReleaseStore;
  downloads: Pick<SentDownloadStore, 'find'>;
  clients: Pick<DownloadClientService, 'records'>;
  queue: Pick<DownloadQueueService, 'send' | 'remove'>;
  indexers: Pick<IndexerService, 'search' | 'list'>;
  profiles: Pick<ProfileService, 'list'>;
  events: EventStore;
  file?: typeof fileDownload;
  now?: () => Date;
  schedule?: Schedule;
  tickEveryMs?: number;
  missingEveryMs?: number;
  firstMissingAfterMs?: number;
  feedsEveryMs?: number;
  stalledForMs?: number;
  say?: (line: string) => void;
};

type Found = { request: MediaRequestRecord; items: RequestItemRecord[] };

const TICK_EVERY_MS = 30_000;

const MISSING_EVERY_MS = 6 * 60 * 60 * 1000;

const FIRST_MISSING_AFTER_MS = 2 * 60 * 1000;

const FEEDS_EVERY_MS = 15 * 60 * 1000;

const STALLED_FOR_MS = 6 * 60 * 60 * 1000;

const NUDGE_AFTER_MS = 1000;

const MOST_FILING_ATTEMPTS = 5;

const MOST_ALIASES_SEARCHED = 2;

const NOTHING_FOUND = 'Nothing acceptable has been found yet';

const IN_FLIGHT = new Set<RequestItemRecord['state']>([
  'searching',
  'chosen',
  'downloading',
  'filing',
]);

const DEFAULT_PROFILE: QualityProfile = {
  ...QualityProfileDraftSchema.parse({ name: 'Default', kind: 'video' }),
  id: '00000000-0000-4000-8000-000000000000',
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

/**
 * A request's films or episodes in one state, by the download each belongs to.
 *
 * @param all - The films or episodes.
 * @param state - The state.
 * @returns Them, by download.
 */
const groupedByDownload = (
  all: readonly RequestItemRecord[],
  state: RequestItemRecord['state'],
): Map<string | null, RequestItemRecord[]> => {
  const grouped = new Map<string | null, RequestItemRecord[]>();

  for (const item of all.filter((one) => one.state === state)) {
    grouped.set(item.downloadId, [...(grouped.get(item.downloadId) ?? []), item]);
  }

  return grouped;
};

/**
 * Fetches what is requested, from the moment a request is approved to the moment it is in the
 * library, keeping every step in the database so a restart halfway through carries on where it
 * stopped.
 *
 * Every half a minute it lets go of what has come out, searches for anything wanted that has not
 * been searched for, follows what is downloading, and files what has finished. Every few hours it
 * searches again for everything still wanted, and for anything its profile would still upgrade —
 * the search for what is missing, which also catches what came out while the service was down —
 * and every quarter of an hour it reads the newest releases on every indexer for any of those.
 *
 * A download that fails, or stalls for hours, blocklists its release for that request and the next
 * best is looked for at once. Filing that fails is tried again a few times before the film or
 * episode is marked failed for an admin to look at.
 *
 * @param requests - Where requests are kept.
 * @param items - Where what each waits for is kept.
 * @param blocked - Releases that failed a request before.
 * @param downloads - What was sent to download clients.
 * @param clients - The download clients.
 * @param queue - The download queue, to send to and take out of.
 * @param indexers - The indexers, to search.
 * @param profiles - The quality profiles, one of which may be each library's.
 * @param events - Where events wait for the server.
 * @param file - How a finished download is filed.
 * @param now - The clock.
 * @param schedule - How to wait.
 * @param tickEveryMs - How often to move everything along.
 * @param missingEveryMs - How often to search for everything missing.
 * @param firstMissingAfterMs - How long after starting to search for everything missing first.
 * @param feedsEveryMs - How often to read the indexers' newest releases.
 * @param stalledForMs - How long a download may stall before another release is tried.
 * @param say - Where to say what happened.
 * @returns The worker.
 */
const createRequestWorker = ({
  requests,
  items,
  blocked,
  downloads,
  clients,
  queue,
  indexers,
  profiles,
  events,
  file = fileDownload,
  now = () => new Date(),
  schedule = waitThenRun,
  tickEveryMs = TICK_EVERY_MS,
  missingEveryMs = MISSING_EVERY_MS,
  firstMissingAfterMs = FIRST_MISSING_AFTER_MS,
  feedsEveryMs = FEEDS_EVERY_MS,
  stalledForMs = STALLED_FOR_MS,
  say = () => undefined,
}: CreateRequestWorkerOptions) => {
  let working: Promise<void> = Promise.resolve();
  let isRunning = false;
  const cancels = new Map<string, () => void>();

  const serially = <Result>(work: () => Promise<Result>): Promise<Result> => {
    const next = working.then(work);

    working = next.then(
      () => undefined,
      (error: Error) => {
        say(`Moving requests along failed: ${error.message}`);
      },
    );

    return next;
  };

  const at = () => now().toISOString();

  const today = () => at().slice(0, 10);

  const update = (item: RequestItemRecord, changes: Partial<Omit<RequestItemRecord, 'id'>>) =>
    items.update(item.id, { ...changes, updatedAt: at() });

  const approved = async (): Promise<Found[]> => {
    const [kept, waiting] = await Promise.all([requests.list(), items.list()]);

    return kept
      .filter((request) => request.approval === 'approved')
      .map((request) => ({
        request,
        items: waiting.filter((item) => item.requestId === request.id),
      }));
  };

  const profileFor = async (request: MediaRequestRecord): Promise<QualityProfile> =>
    (await profiles.list()).find(
      (profile) => profile.kind === 'video' && profile.libraryIds.includes(request.libraryId),
    ) ?? DEFAULT_PROFILE;

  const priorities = async () =>
    new Map((await indexers.list()).map((indexer) => [indexer.id, indexer.priority]));

  const blockedFor = async (requestId: string) =>
    (await blocked.list()).filter((block) => block.requestId === requestId);

  const block = async (
    requestId: string,
    title: string | null,
    indexerId: string | null,
    reason: string,
  ) => {
    if (title !== null) {
      await blocked.insert({ id: randomUUID(), requestId, title, indexerId, reason, at: at() });
    }
  };

  const isUpgradable = (profile: QualityProfile, item: RequestItemRecord): boolean =>
    (item.state === 'available' || item.state === 'filed') &&
    item.filedTitle !== null &&
    wantsUpgrade(profile, item.filedTitle);

  const send = async (
    request: MediaRequestRecord,
    release: Release,
    holding: readonly RequestItemRecord[],
    score: number,
  ): Promise<string | null> => {
    const url = release.magnetUrl ?? release.downloadUrl;

    if (url === null) {
      return 'The release has no link to fetch it by';
    }

    for (const item of holding) {
      await update(item, { state: 'chosen', problem: null });
    }

    const sent = await queue.send({
      indexerId: release.indexerId,
      url,
      title: release.title,
      protocol: release.protocol,
      libraryKind: request.kind === 'film' ? 'movies' : 'shows',
      sizeBytes: release.sizeBytes,
      indexerName: release.indexerName,
    });

    if (typeof sent === 'string') {
      for (const item of holding) {
        await update(item, {
          state: item.state === 'searching' || item.state === 'chosen' ? 'wanted' : item.state,
          problem: sent,
          lastSearchedAt: at(),
        });
      }

      return sent;
    }

    for (const item of holding) {
      await update(item, {
        state: 'downloading',
        problem: null,
        releaseTitle: release.title,
        indexerId: release.indexerId,
        downloadId: sent.id,
        score,
        attempts: 0,
        lastSearchedAt: at(),
      });
    }

    await events.add({
      kind: 'chosen',
      title: request.title,
      requestId: request.id,
      requestedById: request.requestedById,
      releaseTitle: release.title,
    });
    say(`Chose ${release.title} for ${request.title}.`);

    return null;
  };

  const fetchFrom = async (
    { request, items: all }: Found,
    releases: readonly Release[],
    isFetching: (item: RequestItemRecord) => boolean,
  ): Promise<boolean> => {
    const judged = judgeForRequest({
      request,
      items: all,
      releases,
      profile: await profileFor(request),
      blocked: await blockedFor(request.id),
      priorities: await priorities(),
      isFetching,
    });
    const picked = judged.releases.find((release) => release.id === judged.pickedId);
    const holding = picked === undefined ? undefined : judged.holding.get(picked.id);
    const score = judged.judgements.find((judgement) => judgement.releaseId === judged.pickedId);

    if (picked === undefined || holding === undefined || score === undefined) {
      return false;
    }

    return (await send(request, picked, holding, score.score)) === null;
  };

  const searchFor = async (found: Found, fetching: readonly RequestItemRecord[]) => {
    const pending = new Set(fetching.map((item) => item.id));
    const queries = [
      ...new Set([found.request.title, ...found.request.aliases.slice(0, MOST_ALIASES_SEARCHED)]),
    ];
    const plans = planSearches(found.request, found.items, fetching, today());

    for (const item of fetching.filter((one) => one.state === 'wanted')) {
      await update(item, { state: 'searching' });
    }

    const run = async (
      search: ReleaseSearch,
      itemIds: readonly string[],
      asking: readonly string[] = queries,
    ) => {
      for (const query of asking) {
        const outcome = await indexers.search({ ...search, query });
        const current = (await items.list()).filter((item) => item.requestId === found.request.id);

        if (
          await fetchFrom(
            { ...found, items: current },
            outcome.releases,
            (item) => itemIds.includes(item.id) && pending.has(item.id),
          )
        ) {
          for (const id of itemIds) {
            pending.delete(id);
          }

          return true;
        }
      }

      return false;
    };

    for (const plan of plans) {
      const isFetched = await run(plan.search, plan.itemIds);

      if (!isFetched && plan.search.episode === undefined && found.request.kind === 'series') {
        for (const item of fetching.filter((one) => plan.itemIds.includes(one.id))) {
          if (pending.has(item.id) && item.episode !== null) {
            await run({ ...plan.search, episode: item.episode }, [item.id], [found.request.title]);
          }
        }
      }
    }

    for (const item of (await items.list()).filter((one) => pending.has(one.id))) {
      await update(item, {
        state: item.state === 'searching' ? 'wanted' : item.state,
        problem: item.state === 'searching' ? NOTHING_FOUND : item.problem,
        lastSearchedAt: at(),
      });
    }
  };

  const release = async ({ request, items: all }: Found) => {
    for (const item of all.filter((one) => one.state === 'waiting')) {
      const isOut = item.airDate === null ? item.season === null : item.airDate <= today();

      if (isOut) {
        await update(item, { state: 'wanted', problem: null, lastSearchedAt: null });
        say(`${request.title}${item.season === null ? '' : ` ${item.title}`} is out, and wanted.`);
      }
    }
  };

  const giveUp = async (request: MediaRequestRecord, item: RequestItemRecord, problem: string) => {
    await update(item, { state: 'failed', problem });
    await events.add({
      kind: 'stuck',
      title: request.title,
      requestId: request.id,
      requestedById: request.requestedById,
      problem,
    });
  };

  const letGo = (
    item: RequestItemRecord,
    problem: string,
  ): Partial<Omit<RequestItemRecord, 'id'>> =>
    item.filePath === null
      ? {
          state: 'wanted',
          problem,
          downloadId: null,
          releaseTitle: null,
          score: null,
          lastSearchedAt: null,
        }
      : {
          state: 'available',
          problem,
          downloadId: null,
          releaseTitle: item.filedTitle,
          score: item.filedScore,
        };

  const follow = async ({ request, items: all }: Found) => {
    for (const [downloadId, fetching] of groupedByDownload(all, 'downloading')) {
      const download = downloadId === null ? null : await downloads.find(downloadId);

      if (download === null) {
        for (const item of fetching) {
          await update(item, letGo(item, 'The download was taken out before it finished'));
        }

        continue;
      }

      if (download.state === 'done') {
        for (const item of fetching) {
          await update(item, { state: 'filing', attempts: 0 });
        }

        continue;
      }

      const isStalled =
        download.state === 'stalled' &&
        now().getTime() - Date.parse(download.updatedAt) >= stalledForMs;

      if (download.state !== 'failed' && !isStalled) {
        continue;
      }

      const reason = isStalled
        ? 'It stalled, with nobody to fetch it from'
        : (download.problem ?? 'The download failed');

      await block(request.id, download.title, fetching[0]?.indexerId ?? null, reason);
      await queue.remove(download.id, true);

      for (const item of fetching) {
        await update(item, letGo(item, `${reason}. Trying the next best release.`));
      }

      say(`${download.title} failed for ${request.title}: ${reason}.`);
    }
  };

  const fileFinished = async ({ request, items: all }: Found) => {
    for (const [downloadId, filing] of groupedByDownload(all, 'filing')) {
      const download = downloadId === null ? null : await downloads.find(downloadId);
      const client =
        download === null
          ? undefined
          : (await clients.records()).find((one) => one.id === download.clientId);

      if (download === null || client === undefined) {
        for (const item of filing) {
          await update(item, letGo(item, 'The download was taken out before it was filed'));
        }

        continue;
      }

      const attempts = (filing[0]?.attempts ?? 0) + 1;

      const retryOrFail = async (problem: string) => {
        for (const item of filing) {
          await (attempts >= MOST_FILING_ATTEMPTS
            ? giveUp(request, item, problem)
            : update(item, { problem, attempts }));
        }
      };

      if (download.contentPath === null) {
        await retryOrFail(`${client.name} has not said where it put the download`);
        continue;
      }

      try {
        const { filed, missing } = await file(
          request,
          filing,
          mapClientPath(download.contentPath, client),
          download.protocol === 'torrent',
        );

        for (const item of filing) {
          const path = filed.get(item.id);

          await (path === undefined
            ? update(item, letGo(item, 'It was not in what was downloaded'))
            : update(item, {
                state: 'filed',
                problem: null,
                filePath: path,
                filedTitle: item.releaseTitle,
                filedScore: item.score,
                attempts: 0,
              }));
        }

        if (missing.length === filing.length) {
          await block(
            request.id,
            download.title,
            filing[0]?.indexerId ?? null,
            'It held nothing asked for',
          );
        }

        if (filed.size > 0) {
          await events.add({
            kind: 'filed',
            title: request.title,
            requestId: request.id,
            requestedById: request.requestedById,
            requestKind: request.kind,
            tmdbId: request.tmdbId,
            libraryId: request.libraryId,
            folder: libraryFolderOf(request),
          });
          say(`Filed ${download.title} for ${request.title}.`);
        }
      } catch (error) {
        await retryOrFail(
          `It could not be filed: ${error instanceof Error ? error.message : 'no reason given'}`,
        );
      }
    }
  };

  const tick = () =>
    serially(async () => {
      for (const step of [release, follow, fileFinished]) {
        for (const found of await approved()) {
          await step(found);
        }
      }

      for (const found of await approved()) {
        const unsearched = found.items.filter(
          (item) => item.state === 'wanted' && item.lastSearchedAt === null,
        );

        if (unsearched.length > 0) {
          await searchFor(found, unsearched);
        }
      }
    });

  const searchMissing = (): Promise<MissingSearch> =>
    serially(async () => {
      const startedAt = at();
      let searched = 0;

      for (const found of await approved()) {
        const profile = await profileFor(found.request);
        const fetching = found.items.filter(
          (item) => item.state === 'wanted' || isUpgradable(profile, item),
        );

        if (fetching.length > 0) {
          searched += 1;
          await searchFor(found, fetching);
        }
      }

      say(`Searched again for ${searched.toString()} requests still missing something.`);

      return { searched, startedAt };
    });

  const pollFeeds = () =>
    serially(async () => {
      const fetching = await Promise.all(
        (await approved()).map(async (found) => {
          const profile = await profileFor(found.request);

          return {
            found,
            isFetching: (item: RequestItemRecord) =>
              item.state === 'wanted' || isUpgradable(profile, item),
          };
        }),
      );
      const wanting = fetching.filter(({ found, isFetching }) => found.items.some(isFetching));

      if (wanting.length === 0) {
        return;
      }

      const outcome = await indexers.search({ query: '', mode: 'search' });

      for (const { found, isFetching } of wanting) {
        await fetchFrom(found, outcome.releases, isFetching);
      }
    });

  const find = async (id: string): Promise<Found | null> => {
    const request = await requests.find(id);

    return request === null
      ? null
      : { request, items: (await items.list()).filter((item) => item.requestId === id) };
  };

  const quietly = (work: () => Promise<void>): Promise<void> =>
    work().then(
      () => undefined,
      () => undefined,
    );

  const repeat = (name: string, work: () => Promise<void>, everyMs: number, firstMs = everyMs) => {
    const next = (afterMs: number) => {
      cancels.set(
        name,
        schedule(() => {
          void quietly(work).then(() => {
            if (isRunning) {
              next(everyMs);
            }
          });
        }, afterMs),
      );
    };

    next(firstMs);
  };

  return {
    tick,

    searchMissing,

    pollFeeds,

    releasesFor: async (id: string): Promise<ReleaseSearchOutcome | null> => {
      const found = await find(id);

      if (found === null) {
        return null;
      }

      const { request } = found;
      const seasons = [
        ...new Set(found.items.flatMap((item) => (item.season === null ? [] : [item.season]))),
      ];
      const searches: ReleaseSearch[] =
        request.kind === 'film'
          ? [{ query: request.title, mode: 'movie', tmdbId: request.tmdbId }]
          : [
              { query: request.title, mode: 'tv' },
              ...seasons.map((season) => ({ query: request.title, mode: 'tv' as const, season })),
            ];
      const outcomes = await Promise.all(searches.map((search) => indexers.search(search)));
      const releases = [
        ...new Map(
          outcomes.flatMap((outcome) => outcome.releases).map((one) => [one.id, one]),
        ).values(),
      ];
      const reports = new Map<string, IndexerSearchReport>();

      for (const report of outcomes.flatMap((outcome) => outcome.indexers)) {
        const kept = reports.get(report.indexerId);

        reports.set(report.indexerId, {
          ...report,
          found: (kept?.found ?? 0) + report.found,
          tookMs: Math.max(kept?.tookMs ?? 0, report.tookMs),
          problem: kept?.problem ?? report.problem,
        });
      }

      const judged = judgeForRequest({
        request,
        items: found.items,
        releases,
        profile: await profileFor(request),
        blocked: await blockedFor(id),
        priorities: await priorities(),
        isFetching: (item) => !IN_FLIGHT.has(item.state),
      });

      return {
        releases: judged.releases,
        indexers: [...reports.values()],
        judgements: judged.judgements,
        pickedId: judged.pickedId,
      };
    },

    pick: (id: string, picked: Release): Promise<MediaRequest | string | null> =>
      serially(async () => {
        const found = await find(id);

        if (found === null) {
          return null;
        }

        const judged = judgeForRequest({
          request: found.request,
          items: found.items,
          releases: [picked],
          profile: await profileFor(found.request),
          blocked: [],
          priorities: new Map(),
          isFetching: (item) => !IN_FLIGHT.has(item.state),
          isTitleChecked: false,
        });
        const holding = judged.holding.get(picked.id) ?? [];

        if (holding.length === 0) {
          return found.request.kind === 'film'
            ? 'The film is on its way already'
            : 'That release holds no episode this request is waiting for';
        }

        const problem = await send(
          found.request,
          picked,
          holding,
          judged.judgements[0]?.score ?? 0,
        );

        if (problem !== null) {
          return problem;
        }

        const after = await find(id);

        return after === null ? null : showMediaRequest(after.request, after.items);
      }),

    nudge: (): void => {
      cancels.get('nudge')?.();
      cancels.set(
        'nudge',
        schedule(() => {
          void quietly(tick);
        }, NUDGE_AFTER_MS),
      );
    },

    start: async (): Promise<void> => {
      for (const item of await items.list()) {
        if (item.state === 'searching' || item.state === 'chosen') {
          await update(item, { state: 'wanted', lastSearchedAt: null });
        }
      }

      isRunning = true;
      repeat('tick', tick, tickEveryMs, 0);
      repeat(
        'missing',
        async () => {
          await searchMissing();
        },
        missingEveryMs,
        firstMissingAfterMs,
      );
      repeat('feeds', pollFeeds, feedsEveryMs);
    },

    stop: (): void => {
      isRunning = false;

      for (const cancel of cancels.values()) {
        cancel();
      }

      cancels.clear();
    },
  };
};

type RequestWorker = ReturnType<typeof createRequestWorker>;

export type { RequestWorker };

export { createRequestWorker };
