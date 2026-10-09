import { sayingList } from '@ValenceI18n/sayingList';
import { sayingCount } from '@ValenceI18n/sayingCount';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { unlink } from 'node:fs/promises';
import { basename, dirname, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { GIVE_UP_DEFAULTS } from '@ValenceContracts/schemas/GiveUpRules';
import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import { fileAlbum } from '@ValenceRequests/mediaRequests/fileAlbum';
import { fileBook } from '@ValenceRequests/mediaRequests/fileBook';
import { fileDownload } from '@ValenceRequests/mediaRequests/fileDownload';
import { NotAllowedThere } from '@ValenceRequests/mediaRequests/NotAllowedThere';
import { judgeForRequest } from '@ValenceRequests/mediaRequests/judgeForRequest';
import { hashOfDownload } from '@ValenceRequests/mediaRequests/hashOfDownload';
import { libraryFolderOf } from '@ValenceRequests/mediaRequests/libraryFolderOf';
import { mapClientPath } from '@ValenceRequests/mediaRequests/mapClientPath';
import { planSearches } from '@ValenceRequests/mediaRequests/planSearches';
import { queryTitleOf } from '@ValenceRequests/mediaRequests/queryTitleOf';
import { chooseProfile } from '@ValenceRequests/mediaRequests/chooseProfile';
import { itemFromDraft } from '@ValenceRequests/mediaRequests/itemFromDraft';
import { recordFromDraft } from '@ValenceRequests/mediaRequests/recordFromDraft';
import { syncItems } from '@ValenceRequests/mediaRequests/syncItems';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import { episodesInDownload } from '@ValenceRequests/mediaRequests/episodesInDownload';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { showMediaRequest } from '@ValenceRequests/mediaRequests/showMediaRequest';
import { wantsUpgrade } from '@ValenceRequests/mediaRequests/wantsUpgrade';
import { waitThenRun } from '@ValenceRequests/timing/waitThenRun';
import { downloadFacts } from '@ValenceRequests/mediaRequests/downloadFacts';
import { judgeDownload } from '@ValenceRequests/downloads/judgeDownload';
import type { GiveUpRules } from '@ValenceContracts/schemas/GiveUpRules';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import type {
  IndexerSearchReport,
  Release,
  ReleaseProtocol,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import { PROTOCOL_OF_CLIENT } from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadStopNext,
  MediaRequest,
  MediaRequestDraft,
  MissingSearch,
} from '@ValenceContracts/schemas/MediaRequest';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { ProbeClient } from '@ValenceRequests/media/createProbeClient';
import { whatTheFilesSay } from '@ValenceRequests/profiles/whatTheFilesSay';
import { judgeRelease } from '@ValenceRequests/profiles/judgeRelease';
import { qualityRefusedBy } from '@ValenceRequests/profiles/qualityRefusedBy';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { DownloadQueueService } from '@ValenceRequests/downloads/createDownloadQueue';
import type {
  SentDownloadRecord,
  SentDownloadStore,
} from '@ValenceRequests/downloads/SentDownloadRecord';
import type { EventStore } from '@ValenceRequests/events/EventStore';
import type { IndexerService } from '@ValenceRequests/indexers/createIndexerService';
import type {
  BlockedReleaseRecord,
  BlockedReleaseStore,
} from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';
import type { Schedule } from '@ValenceRequests/timing/Schedule';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';

type CreateRequestWorkerOptions = {
  requests: MediaRequestStore;
  items: RequestItemStore;
  blocked: BlockedReleaseStore;
  downloads: Pick<SentDownloadStore, 'find' | 'list' | 'update'>;
  clients: Pick<DownloadClientService, 'records'>;
  queue: Pick<DownloadQueueService, 'send' | 'remove'>;
  indexers: Pick<IndexerService, 'search' | 'list'>;
  profiles: Pick<ProfileService, 'list'>;
  events: EventStore;
  log: RequestLogStore;
  file?: typeof fileDownload;
  probe?: ProbeClient;
  fileMusic?: typeof fileAlbum;
  fileBooks?: typeof fileBook;
  now?: () => Date;
  schedule?: Schedule;
  tickEveryMs?: number;
  missingEveryMs?: number;
  firstMissingAfterMs?: number;
  feedsEveryMs?: number;
  giveUpRules?: () => Promise<GiveUpRules>;
  settlesForMs?: number;
  print?: (line: string) => void;
  handOff?: { step: () => Promise<void> };
};

type Found = { request: MediaRequestRecord; items: RequestItemRecord[] };

const NOTHING_REFUSED: ReadonlyMap<string, Said> = new Map();

const TICK_EVERY_MS = 30_000;

const MISSING_EVERY_MS = 6 * 60 * 60 * 1000;

const FIRST_MISSING_AFTER_MS = 2 * 60 * 1000;

const FEEDS_EVERY_MS = 15 * 60 * 1000;

const MINUTE_MS = 60 * 1000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const SETTLES_FOR_MS = 15 * 60 * 1000;

const NUDGE_AFTER_MS = 1000;

const MOST_FILING_ATTEMPTS = 5;

const MOST_ALIASES_SEARCHED = 2;

const NOTHING_FOUND = saying(
  'requests.mediaRequests.requestWorker.nothingAcceptableHasBeenFoundYet',
);

const LIBRARY_KINDS_OF: Record<MediaRequestRecord['kind'], LibraryKind> = {
  film: 'movies',
  series: 'shows',
  artist: 'music',
  album: 'music',
  book: 'books',
};

const DEFAULT_PROFILES: Record<QualityProfile['kind'], QualityProfile> = {
  video: {
    ...QualityProfileDraftSchema.parse({ name: say('common.default'), kind: 'video' }),
    id: '00000000-0000-4000-8000-000000000000',
    position: 0,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
  music: {
    ...QualityProfileDraftSchema.parse({ name: say('common.default'), kind: 'music' }),
    id: '00000000-0000-4000-8000-000000000001',
    position: 0,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
};

const BOOK_PROFILE: QualityProfile = {
  ...QualityProfileDraftSchema.parse({ name: say('common.books'), kind: 'video', sizes: [] }),
  id: '00000000-0000-4000-8000-000000000002',
  position: 0,
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

/**
 * Says why a finished download could not be filed, and whether it counts as a try. Most often this
 * service does not see the download where its client says it put it, which a folder set on the
 * client puts right, or may not write where it belongs, which PUID and PGID put right — so neither
 * is held against the download, which is filed once the setting is fixed.
 *
 * @param error - What was thrown, where it was an error.
 * @param path - Where the download was looked for.
 * @param clientName - The client that downloaded it.
 * @returns The reason, in words, and whether it counts.
 */
const whyNotFiled = (
  error: Error | null,
  path: string,
  clientName: string,
): { problem: Said; problemCode: ProblemCode | null; isATry: boolean } => {
  if (error instanceof NotAllowedThere) {
    return { problem: error.said, problemCode: 'MayNotWriteToLibrary', isATry: false };
  }

  if (error !== null && 'code' in error && error.code === 'EACCES') {
    return {
      problem: saying('requests.mediaRequests.requestWorker.theRequestsServiceMayNotWrite', {
        message: error.message,
      }),
      problemCode: 'MayNotWriteToLibrary',
      isATry: false,
    };
  }

  return error !== null && 'code' in error && error.code === 'ENOENT'
    ? {
        problem: saying(
          'requests.mediaRequests.requestWorker.valenceCannotSeePathWhereClientName',
          {
            path,
            clientName,
          },
        ),
        problemCode: 'CannotSeeDownload',
        isATry: false,
      }
    : {
        problem: saying('requests.mediaRequests.couldNotBeFiled', {
          reason: error === null ? saying('common.noReasonGiven') : sayVerbatim(error.message),
        }),
        problemCode: null,
        isATry: true,
      };
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
 * A request whose release is to be picked by hand is never searched for by itself, only followed
 * and filed once one is picked.
 *
 * A release sent by hand for a library of films or series is filed too once it has finished,
 * named from what the release's own name says it is.
 *
 * A request whose library hands it to a connected app is left to that app entirely: it is never
 * searched for, sent or filed here, and the hand-off follows it with every round instead.
 *
 * @param requests - Where requests are kept.
 * @param items - Where what each waits for is kept.
 * @param blocked - Releases that failed a request before.
 * @param downloads - What was sent to download clients.
 * @param clients - The download clients.
 * @param queue - The download queue, to send to and take out of.
 * @param indexers - The indexers, to search.
 * @param profiles - The quality profiles, one of which a request or its library may name.
 * @param events - Where events wait for the server.
 * @param log - Where what each request did is kept, for whoever wants to see why.
 * @param file - How a finished download is filed.
 * @param fileMusic - How a finished download of music is filed.
 * @param fileBooks - How a finished download of a book or an audiobook is filed.
 * @param now - The clock.
 * @param schedule - How to wait.
 * @param tickEveryMs - How often to move everything along.
 * @param missingEveryMs - How often to search for everything missing.
 * @param firstMissingAfterMs - How long after starting to search for everything missing first.
 * @param feedsEveryMs - How often to read the indexers' newest releases.
 * @param giveUpRules - When a download is given up on and the next best release tried.
 * @param settlesForMs - How long a download runs before it is judged on how fast it is going.
 * @param print - Where to write what happened.
 * @param handOff - What follows the requests handed to connected apps, run with every round.
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
  log,
  file = fileDownload,
  probe = () => Promise.resolve(null),
  fileMusic = fileAlbum,
  fileBooks = fileBook,
  now = () => new Date(),
  schedule = waitThenRun,
  tickEveryMs = TICK_EVERY_MS,
  missingEveryMs = MISSING_EVERY_MS,
  firstMissingAfterMs = FIRST_MISSING_AFTER_MS,
  feedsEveryMs = FEEDS_EVERY_MS,
  giveUpRules = () => Promise.resolve(GIVE_UP_DEFAULTS),
  settlesForMs = SETTLES_FOR_MS,
  print = () => undefined,
  handOff = { step: () => Promise.resolve() },
}: CreateRequestWorkerOptions) => {
  let working: Promise<void> = Promise.resolve();
  let isRunning = false;
  const cancels = new Map<string, () => void>();

  const serially = <Result>(work: () => Promise<Result>): Promise<Result> => {
    const next = working.then(work);

    working = next.then(
      () => undefined,
      (error: Error) => {
        print(`Moving requests along failed: ${error.message}`);
      },
    );

    return next;
  };

  const at = () => now().toISOString();

  const today = () => at().slice(0, 10);

  const update = (item: RequestItemRecord, changes: Partial<Omit<RequestItemRecord, 'id'>>) =>
    items.update(item.id, {
      ...('problem' in changes && !('problemCode' in changes) ? { problemCode: null } : {}),
      ...changes,
      updatedAt: at(),
    });

  const note = async (
    request: MediaRequestRecord,
    message: Said,
    problemCode: ProblemCode | null = null,
  ) => {
    await log.add(request.id, message, problemCode);
    print(`${request.title}: ${message.message}`);
  };

  const approved = async (): Promise<Found[]> => {
    const [kept, waiting] = await Promise.all([requests.list(), items.list()]);

    return kept
      .filter((request) => request.approval === 'approved' && request.handOff === null)
      .map((request) => ({
        request,
        items: waiting.filter((item) => item.requestId === request.id),
      }));
  };

  const searchedByItself = async (): Promise<Found[]> =>
    (await approved()).filter((found) => !found.request.isPickedByHand);

  const profileFor = async (request: MediaRequestRecord): Promise<QualityProfile> =>
    isBookRequest(request.kind)
      ? BOOK_PROFILE
      : (chooseProfile(request, await profiles.list()) ??
        DEFAULT_PROFILES[isMusicRequest(request.kind) ? 'music' : 'video']);

  const priorities = async () =>
    new Map((await indexers.list()).map((indexer) => [indexer.id, indexer.priority]));

  const blockedFor = async (requestId: string) =>
    (await blocked.list()).filter((block) => block.requestId === requestId);

  const block = async (
    requestId: string,
    title: string | null,
    indexerId: string | null,
    reason: Said,
    infoHash: string | null = null,
  ) => {
    if (title !== null) {
      await blocked.insert({
        id: randomUUID(),
        requestId,
        title,
        infoHash,
        indexerId,
        reason,
        at: at(),
      });
    }
  };

  const downloadingForOthers = async (
    requestId: string,
  ): Promise<{ title: string; infoHash: string | null }[]> => {
    const own = new Set(
      (await items.list()).flatMap((item) =>
        item.requestId === requestId && item.downloadId !== null ? [item.downloadId] : [],
      ),
    );

    return (await downloads.list())
      .filter(
        (download) =>
          !own.has(download.id) && download.state !== 'done' && download.state !== 'failed',
      )
      .map((download) => ({ title: download.title, infoHash: hashOfDownload(download) }));
  };

  const protocolsTaken = async (): Promise<Set<ReleaseProtocol>> =>
    new Set(
      (await clients.records())
        .filter((client) => client.isEnabled)
        .map((client) => PROTOCOL_OF_CLIENT[client.kind]),
    );

  const isStillWanted = async (id: string): Promise<boolean> => {
    const request = await requests.find(id);

    return request !== null && request.approval !== 'refused';
  };

  const isUpgradable = (profile: QualityProfile, item: RequestItemRecord): boolean =>
    !item.isPickedByHand &&
    (item.state === 'available' || item.state === 'filed') &&
    item.filedTitle !== null &&
    wantsUpgrade(profile, item.filedTitle);

  const send = async (
    request: MediaRequestRecord,
    release: Release,
    holding: readonly RequestItemRecord[],
    score: number,
    isPickedByHand = false,
  ): Promise<Said | null> => {
    const url = release.magnetUrl ?? release.downloadUrl;

    if (url === null) {
      return saying('requests.mediaRequests.requestWorker.theReleaseHasNoLinkTo');
    }

    if (!(await isStillWanted(request.id))) {
      return null;
    }

    for (const item of holding) {
      await update(item, { state: 'chosen', problem: null });
    }

    const sent = await queue.send({
      indexerId: release.indexerId,
      url,
      title: release.title,
      protocol: release.protocol,
      libraryKind: LIBRARY_KINDS_OF[request.kind],
      sizeBytes: release.sizeBytes,
      indexerName: release.indexerName,
      minimumSeedSeconds: release.minimumSeedSeconds,
      minimumRatio: release.minimumRatio,
    });

    if ('refused' in sent) {
      for (const item of holding) {
        await update(item, {
          state: item.state === 'searching' || item.state === 'chosen' ? 'wanted' : item.state,
          problem: sent.refused,
          problemCode: sent.problemCode,
          lastSearchedAt: at(),
        });
      }

      return sent.refused;
    }

    if (!(await isStillWanted(request.id))) {
      await queue.remove(sent.id, true).catch(() => false);

      return null;
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
        isPickedByHand,
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
    return null;
  };

  const versionProfileOf = async (
    request: MediaRequestRecord,
    versionProfileId: string | null | undefined,
  ): Promise<QualityProfile> =>
    versionProfileId === null || versionProfileId === undefined
      ? profileFor(request)
      : ((await profiles.list()).find((profile) => profile.id === versionProfileId) ??
        profileFor(request));

  const fetchFrom = async (
    found: Found,
    releases: readonly Release[],
    isFetching: (item: RequestItemRecord) => boolean,
  ): Promise<{ isSent: boolean; said: Said }> => {
    const versions = [...new Set(found.items.map((item) => item.versionProfileId ?? null))].filter(
      (version) =>
        found.items.some((item) => (item.versionProfileId ?? null) === version && isFetching(item)),
    );

    if (versions.length <= 1) {
      return fetchVersion(found, releases, isFetching, versions[0] ?? null);
    }

    const [first, ...rest] = versions;
    const firstOutcome = await fetchVersion(found, releases, isFetching, first ?? null);
    const others = [];

    for (const version of rest) {
      others.push(await fetchVersion(found, releases, isFetching, version));
    }

    return {
      isSent: firstOutcome.isSent || others.some((outcome) => outcome.isSent),
      said: sayingList([firstOutcome.said, ...others.map((outcome) => outcome.said)]),
    };
  };

  const fetchVersion = async (
    { request, items: every }: Found,
    releases: readonly Release[],
    isFetching: (item: RequestItemRecord) => boolean,
    version: string | null,
  ): Promise<{ isSent: boolean; said: Said }> => {
    const all = every.filter((item) => (item.versionProfileId ?? null) === version);
    const judged = judgeForRequest({
      request,
      items: all,
      releases,
      profile: await versionProfileOf(request, version),
      blocked: await blockedFor(request.id),
      priorities: await priorities(),
      isFetching,
      takes: await protocolsTaken(),
      downloading: await downloadingForOthers(request.id),
    });
    const picked = judged.releases.find((release) => release.id === judged.pickedId);
    const holding = picked === undefined ? undefined : judged.holding.get(picked.id);
    const score = judged.judgements.find((judgement) => judgement.releaseId === judged.pickedId);
    const forIt = judged.releases.length;

    if (picked === undefined || holding === undefined || score === undefined) {
      const best = judged.releases[0];
      const [firstWhy, ...restWhy] = judged.judgements[0]?.rejections ?? [];

      return {
        isSent: false,
        said:
          best === undefined || firstWhy === undefined
            ? sayingCount('requests.mediaRequests.noneFoundForIt', releases.length)
            : saying('requests.mediaRequests.requestWorker.forItOfThemForItAnd', {
                forIt,
                title: best.title,
                why: sayingList([firstWhy, ...restWhy]),
              }),
      };
    }

    const problem = await send(request, picked, holding, score.score);

    return problem === null
      ? {
          isSent: true,
          said: saying('requests.mediaRequests.requestWorker.choseTitleTheBestOfForIt', {
            title: picked.title,
            forIt,
          }),
        }
      : {
          isSent: false,
          said: saying('requests.mediaRequests.choseButCouldNotSend', {
            title: picked.title,
            problem,
          }),
        };
  };

  const describeSearch = (search: ReleaseSearch): Said => {
    if (search.album !== undefined) {
      return saying('requests.mediaRequests.searchWhat.album', { album: search.album });
    }

    return search.season === undefined
      ? saying('requests.mediaRequests.searchWhat.it')
      : search.episode === undefined
        ? saying('requests.mediaRequests.searchWhat.season', { season: search.season })
        : saying('common.searchWhatEpisode', {
            season: search.season.toString().padStart(2, '0'),
            episode: search.episode.toString().padStart(2, '0'),
          });
  };

  const searchFor = async (found: Found, fetching: readonly RequestItemRecord[]) => {
    const pending = new Set(fetching.map((item) => item.id));
    const queries = [
      ...new Set(
        [found.request.title, ...found.request.aliases.slice(0, MOST_ALIASES_SEARCHED)].map(
          queryTitleOf,
        ),
      ),
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
        const fetched = await fetchFrom(
          { ...found, items: current },
          outcome.releases,
          (item) => itemIds.includes(item.id) && pending.has(item.id),
        );
        const what = describeSearch(search);
        const searched =
          outcome.indexers.length === 0
            ? saying('requests.mediaRequests.noIndexerOn')
            : sayingCount('requests.mediaRequests.foundByIndexers', outcome.indexers.length, {
                found: outcome.releases.length,
                fetched: fetched.said,
              });

        await note(
          found.request,
          query === search.query || query === queries[0]
            ? saying('requests.mediaRequests.searched', { what, outcome: searched })
            : saying('requests.mediaRequests.searchedAs', { what, query, outcome: searched }),
        );

        for (const report of outcome.indexers) {
          if (report.problem !== null) {
            await note(
              found.request,
              saying('requests.mediaRequests.indexerCouldNotAnswer', {
                indexer: report.indexerName,
                problem: report.problem,
              }),
              report.problemCode,
            );
          }
        }

        if (fetched.isSent) {
          for (const id of itemIds) {
            pending.delete(id);
          }

          return true;
        }
      }

      return false;
    };

    for (const plan of plans) {
      const isFetched = await run(
        plan.search,
        plan.itemIds,
        isMusicRequest(found.request.kind) ? [plan.search.query ?? ''] : queries,
      );

      if (!isFetched && plan.search.episode === undefined && found.request.kind === 'series') {
        for (const item of fetching.filter((one) => plan.itemIds.includes(one.id))) {
          if (pending.has(item.id) && item.episode !== null) {
            await run({ ...plan.search, episode: item.episode }, [item.id], queries.slice(0, 1));
          }
        }
      }
    }

    for (const item of (await items.list()).filter((one) => pending.has(one.id))) {
      await update(item, {
        state: item.state === 'searching' ? 'wanted' : item.state,
        problem: item.state === 'searching' ? NOTHING_FOUND : item.problem,
        problemCode: item.state === 'searching' ? null : item.problemCode,
        lastSearchedAt: at(),
      });
    }
  };

  const release = async ({ request, items: all }: Found) => {
    const out = all.filter(
      (item) =>
        item.state === 'waiting' &&
        (item.airDate === null ? item.season === null : item.airDate <= today()),
    );

    for (const item of out) {
      await update(item, { state: 'wanted', problem: null, lastSearchedAt: null });
    }

    if (out.length > 0) {
      await note(
        request,
        request.kind === 'film' || request.kind === 'album' || request.kind === 'book'
          ? saying('requests.mediaRequests.requestWorker.itIsOutAndWanted')
          : sayingCount(
              request.kind === 'artist'
                ? 'requests.mediaRequests.albumsOut'
                : 'requests.mediaRequests.episodesOut',
              out.length,
            ),
      );
    }
  };

  const giveUp = async (
    request: MediaRequestRecord,
    item: RequestItemRecord,
    problem: Said,
    problemCode: ProblemCode | null = null,
  ) => {
    await update(item, { state: 'failed', problem, problemCode });
    await events.add({
      kind: 'stuck',
      title: request.title,
      requestId: request.id,
      requestedById: request.requestedById,
      problem,
    });
  };

  const letGo = (item: RequestItemRecord, problem: Said): Partial<Omit<RequestItemRecord, 'id'>> =>
    item.filePath === null
      ? {
          state: 'wanted',
          problem,
          downloadId: null,
          releaseTitle: null,
          score: null,
          isPickedByHand: false,
          lastSearchedAt: null,
        }
      : {
          state: 'available',
          problem,
          downloadId: null,
          releaseTitle: item.filedTitle,
          score: item.filedScore,
          isPickedByHand: false,
        };

  const follow = async ({ request, items: all }: Found) => {
    const rules = await giveUpRules();
    const within = (count: number | null, unitMs: number) =>
      count === null ? null : count * unitMs;

    for (const [downloadId, fetching] of groupedByDownload(all, 'downloading')) {
      const download = downloadId === null ? null : await downloads.find(downloadId);

      if (download === null) {
        for (const item of fetching) {
          await update(
            item,
            letGo(
              item,
              saying('requests.mediaRequests.requestWorker.theDownloadWasTakenOutBefore2'),
            ),
          );
        }

        await note(
          request,
          saying('requests.mediaRequests.requestWorker.itsDownloadWasTakenOutBefore'),
        );
        continue;
      }

      if (download.state === 'done') {
        for (const item of fetching) {
          await update(item, { state: 'filing', attempts: 0 });
        }

        continue;
      }

      const judged = judgeDownload(download, now(), {
        metadataForMs: within(rules.metadataMinutes, MINUTE_MS),
        stalledForMs: within(rules.stalledHours, HOUR_MS),
        settlesForMs,
        wouldTakeLongerThanMs: within(rules.slowDays, DAY_MS),
      });

      if (!judged.isDoomed) {
        continue;
      }

      const reason = judged.reason ?? saying('common.theDownloadFailed');

      await block(
        request.id,
        download.title,
        fetching[0]?.indexerId ?? null,
        reason,
        hashOfDownload(download),
      );
      await queue.remove(download.id, true);

      for (const item of fetching) {
        await update(
          item,
          letGo(
            item,
            saying('requests.mediaRequests.requestWorker.reasonTryingTheNextBestRelease', {
              reason,
            }),
          ),
        );
      }

      await note(
        request,
        saying('requests.mediaRequests.requestWorker.titleFailedReasonItIsBlocklisted', {
          title: download.title,
          reason,
        }),
      );
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
          await update(
            item,
            letGo(
              item,
              saying('requests.mediaRequests.requestWorker.theDownloadWasTakenOutBefore'),
            ),
          );
        }

        continue;
      }

      const attempts = (filing[0]?.attempts ?? 0) + 1;

      const retryOrFail = async (
        problem: Said,
        isATry = true,
        problemCode: ProblemCode | null = null,
      ) => {
        if (filing[0]?.problem?.message !== problem.message) {
          await note(
            request,
            saying('requests.mediaRequests.notFiled', { title: download.title, problem }),
            problemCode,
          );
        }

        for (const item of filing) {
          await (!isATry
            ? update(item, { problem, problemCode })
            : attempts >= MOST_FILING_ATTEMPTS
              ? giveUp(request, item, problem, problemCode)
              : update(item, { problem, problemCode, attempts }));
        }
      };

      if (download.contentPath === null) {
        await retryOrFail(
          saying('requests.mediaRequests.requestWorker.nameHasNotSaidWhereIt', {
            name: client.name,
          }),
        );
        continue;
      }

      const path = mapClientPath(download.contentPath, client);

      try {
        const { filed, missing, refused } = isMusicRequest(request.kind)
          ? {
              ...(await fileMusic(request, filing, path, download.protocol === 'torrent')),
              refused: NOTHING_REFUSED,
            }
          : isBookRequest(request.kind)
            ? {
                ...(await fileBooks(request, filing, path, download.protocol === 'torrent')),
                refused: NOTHING_REFUSED,
              }
            : await file(
                request,
                filing,
                path,
                download.protocol === 'torrent',
                probe,
                await refusalsFor(request, filing),
              );

        for (const item of filing) {
          const path = filed.get(item.id);
          const why = refused.get(item.id);

          if (why !== undefined || path === undefined) {
            await update(
              item,
              letGo(item, why ?? saying('requests.mediaRequests.requestWorker.itWasNotInWhatWas')),
            );
            continue;
          }

          const filedTitle = filedAs(path, item.releaseTitle);
          const score =
            filedTitle === null || filedTitle === item.releaseTitle
              ? item.score
              : await scoreOfFiled(filedTitle, download, request, filing.length);

          await update(item, {
            state: 'filed',
            problem: null,
            filePath: path,
            filedTitle,
            score,
            filedScore: score,
            attempts: 0,
            ...downloadFacts(download),
          });
        }

        const firstRefusal = [...refused.values()][0];

        if (firstRefusal !== undefined) {
          await block(
            request.id,
            download.title,
            filing[0]?.indexerId ?? null,
            firstRefusal,
            hashOfDownload(download),
          );
          await note(
            request,
            saying('requests.mediaRequests.requestWorker.titleWasNotFiledFirstRefusalIt', {
              title: download.title,
              firstRefusal,
            }),
          );
        }

        if (missing.length === filing.length) {
          await block(
            request.id,
            download.title,
            filing[0]?.indexerId ?? null,
            saying('requests.mediaRequests.requestWorker.itHeldNothingAskedFor'),
            hashOfDownload(download),
          );
        }

        const album = filing.find((item) => filed.has(item.id) && item.musicBrainzId !== null);
        const book = isBookRequest(request.kind)
          ? filing.find((item) => filed.has(item.id))
          : undefined;
        const folder =
          book !== undefined
            ? (filed.get(book.id) ?? '')
            : album === undefined
              ? libraryFolderOf(request)
              : (filed.get(album.id) ?? '');

        if (filed.size > 0) {
          await downloads.update(download.id, { filedInto: folder, updatedAt: at() });
          await events.add({
            kind: 'filed',
            title: request.title,
            requestId: request.id,
            requestedById: request.requestedById,
            requestKind: request.kind,
            tmdbId: request.tmdbId,
            musicBrainzId: album?.musicBrainzId ?? null,
            libraryId: request.libraryId,
            folder,
          });
          await note(
            request,
            saying('requests.mediaRequests.requestWorker.filedSizeFromTitleIntoFolder', {
              size: filed.size.toString(),
              title: download.title,
              folder,
            }),
          );
        }
      } catch (error) {
        const why = whyNotFiled(error instanceof Error ? error : null, path, client.name);

        await retryOrFail(why.problem, why.isATry, why.problemCode);
      }
    }
  };

  const fileSentVideo = async (
    into: { libraryPath: string; title: string; year: number | null },
    libraryKind: LibraryKind,
    parsed: ReturnType<typeof parseReleaseName>,
    path: string,
    protocol: Release['protocol'],
    releaseTitle: string,
  ): Promise<string | null> => {
    const wanted =
      libraryKind === 'movies'
        ? [{ id: 'film', season: null, episode: null }]
        : await episodesInDownload(path, parsed);
    const { filed } = await file(
      { ...into, libraryFolder: null, seasonFolders: [] },
      wanted.map((one) => ({ ...one, title: '', airDate: null, filePath: null, releaseTitle })),
      path,
      protocol === 'torrent',
      probe,
    );

    return filed.size === 0 ? null : libraryFolderOf({ ...into, libraryFolder: null });
  };

  const fileSentAlbum = async (
    title: string,
    libraryPath: string,
    path: string,
    protocol: Release['protocol'],
  ): Promise<string | null> => {
    const [artist = title, album = title] = title.split(/\s+-\s+/);
    const { filed } = await fileMusic(
      { libraryPath, title: artist, artistName: artist },
      [{ id: 'album', title: album, airDate: null, filePath: null }],
      path,
      protocol === 'torrent',
    );

    return filed.get('album') ?? null;
  };

  const fileSentBook = async (
    title: string,
    libraryPath: string,
    path: string,
    protocol: Release['protocol'],
  ): Promise<string | null> => {
    const split = title.indexOf(' - ');
    const author = split === -1 ? null : title.slice(0, split).trim();
    const book = split === -1 ? title : title.slice(split + 3).trim();
    const { filed } = await fileBooks(
      { libraryPath, title: book, artistName: author },
      [{ id: 'book', title: book }],
      path,
      protocol === 'torrent',
      { isNamedByItsFiles: true },
    );

    return filed.get('book') ?? null;
  };

  const fileSentByHand = async () => {
    const claimed = new Set(
      (await items.list()).flatMap((item) => (item.downloadId === null ? [] : [item.downloadId])),
    );
    const finished = (await downloads.list()).filter(
      (download) =>
        download.state === 'done' &&
        download.libraryId !== null &&
        download.libraryPath !== null &&
        download.filedInto === null &&
        download.filingAttempts < MOST_FILING_ATTEMPTS &&
        !claimed.has(download.id),
    );

    for (const download of finished) {
      const client = (await clients.records()).find((one) => one.id === download.clientId);
      const parsed = parseReleaseName(download.title);
      const into = {
        libraryPath: download.libraryPath ?? '',
        title: parsed.title,
        year: parsed.year,
      };

      const couldNot = async (
        problem: Said,
        isATry = true,
        problemCode: ProblemCode | null = null,
      ) => {
        await downloads.update(download.id, {
          filingProblem: problem,
          filingProblemCode: problemCode,
          filingAttempts: download.filingAttempts + (isATry ? 1 : 0),
          updatedAt: at(),
        });
      };

      if (client === undefined || download.contentPath === null) {
        await couldNot(
          client === undefined
            ? saying('requests.mediaRequests.itsClientHasNotSaidWhere')
            : saying('requests.mediaRequests.requestWorker.nameHasNotSaidWhereIt', {
                name: client.name,
              }),
        );
        continue;
      }

      if (parsed.title === '') {
        await couldNot(saying('requests.mediaRequests.requestWorker.itsNameDoesNotSayWhat'));
        continue;
      }

      const path = mapClientPath(download.contentPath, client);

      try {
        const folder =
          download.libraryKind === 'music'
            ? await fileSentAlbum(parsed.title, into.libraryPath, path, download.protocol)
            : download.libraryKind === 'books'
              ? await fileSentBook(parsed.title, into.libraryPath, path, download.protocol)
              : await fileSentVideo(
                  into,
                  download.libraryKind,
                  parsed,
                  path,
                  download.protocol,
                  download.title,
                );

        if (folder === null) {
          await couldNot(
            download.libraryKind === 'music'
              ? saying('requests.mediaRequests.requestWorker.noTrackInItCouldBe')
              : download.libraryKind === 'books'
                ? saying('requests.mediaRequests.requestWorker.noBookInItCouldBe')
                : saying('requests.mediaRequests.requestWorker.noVideoInItCouldBe'),
          );
          continue;
        }

        await downloads.update(download.id, {
          filedInto: folder,
          filingProblem: null,
          filingProblemCode: null,
          updatedAt: at(),
        });
        await events.add({
          kind: 'imported',
          title: download.title,
          libraryId: download.libraryId ?? '',
          folder,
        });
        print(`Filed ${download.title} into ${folder}.`);
      } catch (error) {
        const why = whyNotFiled(error instanceof Error ? error : null, path, client.name);

        await couldNot(why.problem, why.isATry, why.problemCode);
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

      await fileSentByHand();
      await handOff.step();

      for (const found of await searchedByItself()) {
        const unsearched = found.items.filter(
          (item) => item.state === 'wanted' && item.lastSearchedAt === null && item.isFollowed,
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

      for (const found of await searchedByItself()) {
        const fetching = [];

        for (const item of found.items) {
          const profile = await versionProfileOf(found.request, item.versionProfileId);

          if (item.isFollowed && (item.state === 'wanted' || isUpgradable(profile, item))) {
            fetching.push(item);
          }
        }

        if (fetching.length > 0) {
          searched += 1;
          await searchFor(found, fetching);
        }
      }

      print(`Searched again for ${searched.toString()} requests still missing something.`);

      return { searched, startedAt };
    });

  const pollFeeds = () =>
    serially(async () => {
      const fetching = await Promise.all(
        (await searchedByItself()).map(async (found) => {
          const byVersion = new Map(
            await Promise.all(
              [...new Set(found.items.map((item) => item.versionProfileId ?? null))].map(
                async (version) =>
                  [version, await versionProfileOf(found.request, version)] as const,
              ),
            ),
          );

          return {
            found,
            isFetching: (item: RequestItemRecord) => {
              const profile = byVersion.get(item.versionProfileId ?? null);

              return (
                item.isFollowed &&
                (item.state === 'wanted' || (profile !== undefined && isUpgradable(profile, item)))
              );
            },
          };
        }),
      );
      const wanting = fetching.filter(({ found, isFetching }) => found.items.some(isFetching));

      if (wanting.length === 0) {
        return;
      }

      const outcome = await indexers.search({ query: '', mode: 'search' });

      for (const { found, isFetching } of wanting) {
        const fetched = await fetchFrom(found, outcome.releases, isFetching);

        if (fetched.isSent) {
          await note(
            found.request,
            saying('requests.mediaRequests.requestWorker.amongTheNewestReleasesSaid', {
              said: fetched.said,
            }),
          );
        }
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

  const searchesByHand = (
    request: MediaRequestRecord,
    seasons: readonly number[],
  ): ReleaseSearch[] => {
    const query = queryTitleOf(request.title);
    const artist = queryTitleOf(request.artistName ?? request.title);

    switch (request.kind) {
      case 'film':
        return [
          {
            query,
            mode: 'movie',
            ...(request.tmdbId === null ? {} : { tmdbId: request.tmdbId }),
            ...(request.imdbId === null ? {} : { imdbId: request.imdbId }),
          },
        ];
      case 'series': {
        const ids = {
          ...(request.tvdbId === null ? {} : { tvdbId: request.tvdbId }),
          ...(request.imdbId === null ? {} : { imdbId: request.imdbId }),
        };

        return [
          { query, mode: 'tv', ...ids },
          ...seasons.map((season) => ({ query, mode: 'tv' as const, season, ...ids })),
        ];
      }
      case 'artist':
        return [{ query: artist, mode: 'music', artist }];
      case 'album':
        return [{ query: `${artist} ${query}`, mode: 'music', artist, album: query }];
      case 'book':
        return [
          { query: request.artistName === null ? query : `${query} ${artist}`, mode: 'book' },
        ];
    }
  };

  const releasesOf = async (
    found: Found,
    blockedList: readonly BlockedReleaseRecord[],
  ): Promise<ReleaseSearchOutcome> => {
    const { request } = found;
    const seasons = [
      ...new Set(found.items.flatMap((item) => (item.season === null ? [] : [item.season]))),
    ];
    const searches = searchesByHand(request, seasons);
    const outcomes = await Promise.all(searches.map((search) => indexers.search(search)));
    const releases = [
      ...new Map(
        outcomes.flatMap((outcome) => outcome.releases).map((one) => [one.id, one]),
      ).values(),
    ];
    const reports = new Map<string, IndexerSearchReport>();

    for (const report of outcomes.flatMap((outcome) => outcome.indexers)) {
      const kept = reports.get(report.indexerId);
      const telling = kept !== undefined && kept.problem !== null ? kept : report;

      reports.set(report.indexerId, {
        ...report,
        found: (kept?.found ?? 0) + report.found,
        tookMs: Math.max(kept?.tookMs ?? 0, report.tookMs),
        problem: telling.problem,
        problemCode: telling.problemCode,
      });
    }

    const judged = judgeForRequest({
      request,
      items: found.items,
      releases,
      profile: await profileFor(request),
      blocked: blockedList,
      priorities: await priorities(),
      isFetching: (item) => item.state !== 'filing',
      keepsTheUnnamed: true,
      takes: await protocolsTaken(),
      downloading: await downloadingForOthers(request.id),
    });

    return {
      releases: judged.releases,
      indexers: [...reports.values()],
      judgements: judged.judgements,
      pickedId: judged.pickedId,
    };
  };

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

  /**
   * What a filed copy is remembered as, for judging later whether to upgrade it: its file's own
   * name, which says what it was found to be, where that name says its resolution, and otherwise the
   * release it came from.
   *
   * @param path - Where it was filed.
   * @param releaseTitle - The release it came from.
   * @returns The name to judge it by.
   */
  const filedAs = (path: string, releaseTitle: string | null): string | null => {
    const named = basename(path, extname(path));

    return parseReleaseName(named).resolution === null ? releaseTitle : named;
  };

  /**
   * What a filed copy scores, judged as a release would be but by the name it was filed under,
   * which says what it was found to be, so a better release is weighed against the copy on disk
   * rather than against what the title it came under claimed.
   *
   * @param filedTitle - The name it was filed under.
   * @param download - The download it came from, for its size and where it was found.
   * @param request - What was asked for.
   * @param episodes - How many of the request's films or episodes the download held.
   * @returns Its score.
   */
  const scoreOfFiled = async (
    filedTitle: string,
    download: SentDownloadRecord,
    request: MediaRequestRecord,
    episodes: number,
  ): Promise<number> =>
    judgeRelease(
      {
        id: filedTitle,
        title: filedTitle,
        indexerId: '',
        indexerName: download.indexerName ?? '',
        protocol: download.protocol,
        sizeBytes: download.sizeBytes,
        seeders: null,
        leechers: null,
        grabs: null,
        publishedAt: null,
        categories: [],
        downloadUrl: null,
        magnetUrl: null,
        infoUrl: null,
        infoHash: null,
        downloadFactor: null,
        uploadFactor: null,
        minimumRatio: null,
        minimumSeedSeconds: null,
      },
      parseReleaseName(filedTitle),
      await profileFor(request),
      request.runtimeMinutes ?? undefined,
      episodes,
    ).score;

  /**
   * How a request's films and episodes are judged as they are filed, by what each video is found to
   * be rather than what its release was called. A release picked by hand is left as it was picked.
   *
   * @param request - What was asked for.
   * @param filing - The films or episodes being filed from one download.
   * @returns Why a video is refused, or nothing where it is what was asked for.
   */
  const refusalsFor = async (
    request: MediaRequestRecord,
    filing: readonly RequestItemRecord[],
  ): Promise<(found: Partial<ParsedRelease>) => Said | null> => {
    if (request.isPickedByHand || filing.some((item) => item.isPickedByHand)) {
      return () => null;
    }

    const profile = await profileFor(request);

    return (found) => {
      const refused = qualityRefusedBy(found, profile);

      return refused === null
        ? null
        : saying('requests.mediaRequests.requestWorker.notTakenByProfile', {
            quality: QUALITY_LABELS[refused],
          });
    };
  };

  /**
   * Whether the videos a download turned out to hold are what its request asked for, judged by their
   * own names against the request's profile, so a release whose title said more than its files do
   * is thrown out and the next best looked for. A release somebody picked by hand is left as they
   * picked it. Asked while a release is still being sent, before its request knows which download
   * it became, it says so by failing, so the question is asked again rather than answered wrongly.
   *
   * @param download - The download, once its client can list what it holds.
   * @param videos - The names of the videos it holds.
   * @returns Why it is not wanted, or null.
   */
  const judgeFiles = async (
    download: Pick<SentDownloadRecord, 'id'>,
    videos: readonly string[],
  ): Promise<Said | null> => {
    const all = await items.list();
    const held = all.find((item) => item.downloadId === download.id);

    if (held === undefined && all.some((item) => item.state === 'chosen')) {
      throw new Error('It is not yet known which request it was sent for');
    }

    const request = held === undefined ? null : await requests.find(held.requestId);

    if (request === null || request.isPickedByHand || held?.isPickedByHand === true) {
      return null;
    }

    return whatTheFilesSay(videos, await profileFor(request));
  };

  /**
   * Stops whatever is downloading for the films or episodes a release picked by hand will fetch
   * instead, deleting what it had and blocking it for the request so nothing picks it again. Anything
   * else a stopped download held goes back to being wanted.
   *
   * @param found - The request and everything it waits for.
   * @param replacing - What the picked release will fetch.
   * @param picked - The release picked.
   */
  const replaceDownloadsOf = async (
    found: Found,
    replacing: readonly RequestItemRecord[],
    picked: Release,
  ) => {
    const stopping = [
      ...new Set(
        replacing.flatMap((item) =>
          item.downloadId !== null && (item.state === 'downloading' || item.state === 'chosen')
            ? [item.downloadId]
            : [],
        ),
      ),
    ];
    const reason = saying('requests.mediaRequests.requestWorker.replacedByTitlePickedByHand', {
      title: picked.title,
    });

    for (const downloadId of stopping) {
      const download = await downloads.find(downloadId);
      const held = found.items.filter((item) => item.downloadId === downloadId);

      if (download !== null) {
        await block(
          found.request.id,
          download.title,
          held[0]?.indexerId ?? null,
          reason,
          hashOfDownload(download),
        );
      }

      await queue.remove(downloadId, true).catch(() => false);

      for (const item of held) {
        await update(item, letGo(item, reason));
      }

      await note(
        found.request,
        saying('requests.mediaRequests.requestWorker.stoppedTitleForAReleasePicked', {
          title: download?.title ?? picked.title,
        }),
      );
    }
  };

  return {
    tick,

    judgeFiles,

    searchMissing,

    pollFeeds,

    unfinishedDownloadsOf: async (id: string): Promise<string[]> => [
      ...new Set(
        (await items.list()).flatMap((item) =>
          item.requestId === id &&
          item.downloadId !== null &&
          (item.state === 'chosen' || item.state === 'downloading' || item.state === 'filing')
            ? [item.downloadId]
            : [],
        ),
      ),
    ],

    dropDownloads: (downloadIds: readonly string[]): Promise<number> =>
      serially(async () => {
        for (const downloadId of downloadIds) {
          await queue.remove(downloadId, true).catch(() => false);
        }

        return downloadIds.length;
      }),

    stopDownload: (
      id: string,
      downloadId: string,
      stopping: { next: DownloadStopNext; isDeletingFiles: boolean },
    ): Promise<MediaRequest | null> =>
      serially(async () => {
        const found = await find(id);
        const held = found?.items.filter((item) => item.downloadId === downloadId) ?? [];

        if (found === null || held.length === 0) {
          return null;
        }

        const download = await downloads.find(downloadId);
        const reason = saying('requests.mediaRequests.requestWorker.stoppedByAnAdmin');

        if (download !== null && stopping.next !== 'nothing') {
          await block(
            id,
            download.title,
            held[0]?.indexerId ?? null,
            reason,
            hashOfDownload(download),
          );
        }

        await queue.remove(downloadId, stopping.isDeletingFiles).catch(() => false);

        for (const item of held) {
          await update(item, {
            ...letGo(item, reason),
            ...(stopping.next === 'another' ? {} : { lastSearchedAt: at() }),
            ...(stopping.next === 'nothing' ? { isFollowed: false } : {}),
          });
        }

        await note(
          found.request,
          saying(
            stopping.next === 'another'
              ? 'requests.mediaRequests.requestWorker.stoppedTitleAndLookingForAnother'
              : stopping.next === 'byHand'
                ? 'requests.mediaRequests.requestWorker.stoppedTitleForAPickByHand'
                : 'requests.mediaRequests.requestWorker.stoppedTitleAndStoppedGetting',
            { title: download?.title ?? held[0]?.releaseTitle ?? '' },
          ),
        );

        const after = await find(id);

        return after === null ? null : showMediaRequest(after.request, after.items);
      }),

    blockDownload: async (downloadId: string): Promise<number> => {
      const download = await downloads.find(downloadId);
      const held = (await items.list()).filter((item) => item.downloadId === downloadId);
      const requestIds = [...new Set(held.map((item) => item.requestId))];

      for (const requestId of requestIds) {
        await block(
          requestId,
          download?.title ??
            held.find((item) => item.requestId === requestId)?.releaseTitle ??
            null,
          held.find((item) => item.requestId === requestId)?.indexerId ?? null,
          saying('requests.mediaRequests.requestWorker.removedFromTheDownloads'),
          download === null ? null : hashOfDownload(download),
        );
      }

      return requestIds.length;
    },

    deleteFiled: (id: string): Promise<string[]> =>
      serially(async () => {
        const filed = (await items.list()).filter(
          (item) => item.requestId === id && item.filePath !== null,
        );
        const folders = new Set<string>();

        for (const item of filed) {
          if (item.filePath !== null) {
            await unlink(item.filePath).catch(() => undefined);
            folders.add(dirname(item.filePath));
          }
        }

        return [...folders];
      }),

    blockedFor,

    unblock: (id: string): Promise<boolean> => blocked.remove(id),

    releasesFor: async (id: string): Promise<ReleaseSearchOutcome | null> => {
      const found = await find(id);

      return found === null ? null : releasesOf(found, await blockedFor(id));
    },

    releasesForDraft: (asked: MediaRequestDraft): Promise<ReleaseSearchOutcome> => {
      const draft = MediaRequestDraftSchema.parse(asked);
      const request = recordFromDraft(draft, randomUUID(), at());

      return releasesOf(
        {
          request,
          items: syncItems(request, draft.catalogue, [], 'digital', draft.held?.episodes ?? [])
            .add.filter((one) => one.state === 'waiting')
            .map((one) => ({
              ...itemFromDraft(one, randomUUID(), request.id, at()),
              state: 'wanted',
            })),
        },
        [],
      );
    },

    pick: (id: string, picked: Release): Promise<MediaRequest | { refused: Said } | null> =>
      serially(async () => {
        const found = await find(id);

        if (found === null) {
          return null;
        }

        if (found.request.handOff !== null) {
          return {
            refused: saying('requests.mediaRequests.requestWorker.itIsHandedToAConnectedApp'),
          };
        }

        const judged = judgeForRequest({
          request: found.request,
          items: found.items,
          releases: [picked],
          profile: await profileFor(found.request),
          blocked: [],
          priorities: new Map(),
          isFetching: (item) => item.state !== 'filing',
          isTitleChecked: false,
        });
        const holding = judged.holding.get(picked.id) ?? [];

        if (holding.length > 0) {
          await replaceDownloadsOf(found, holding, picked);
        }

        if (holding.length > 0 && found.request.approval !== 'approved') {
          await requests.update(id, {
            approval: 'approved',
            refusedBecause: null,
            updatedAt: at(),
          });
        }

        if (holding.length === 0) {
          return {
            refused:
              found.request.kind === 'film'
                ? saying('requests.mediaRequests.requestWorker.theFilmIsOnItsWay')
                : saying(
                    isMusicRequest(found.request.kind)
                      ? 'requests.mediaRequests.releaseHoldsNoAlbumWaited'
                      : 'requests.mediaRequests.releaseHoldsNoEpisodeWaited',
                  ),
          };
        }

        const problem = await send(
          found.request,
          picked,
          holding,
          judged.judgements[0]?.score ?? 0,
          true,
        );

        if (problem !== null) {
          return { refused: problem };
        }

        await note(
          found.request,
          saying('requests.mediaRequests.requestWorker.titleWasPickedByHand', {
            title: picked.title,
          }),
        );

        const after = await find(id);

        return after === null ? null : showMediaRequest(after.request, after.items);
      }),

    fileNow: (
      id: string,
      library: { id: string; path: string },
    ): Promise<SentDownloadRecord | 'claimed' | null> =>
      serially(async () => {
        if ((await downloads.find(id)) === null) {
          return null;
        }

        if ((await items.list()).some((item) => item.downloadId === id)) {
          return 'claimed';
        }

        await downloads.update(id, {
          libraryId: library.id,
          libraryPath: library.path,
          filedInto: null,
          filingProblem: null,
          filingProblemCode: null,
          filingAttempts: 0,
          updatedAt: at(),
        });
        await fileSentByHand();

        return downloads.find(id);
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
