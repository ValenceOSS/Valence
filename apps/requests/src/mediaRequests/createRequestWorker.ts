import { randomUUID } from 'node:crypto';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import { fileAlbum } from '@ValenceRequests/mediaRequests/fileAlbum';
import { fileBook } from '@ValenceRequests/mediaRequests/fileBook';
import { fileDownload } from '@ValenceRequests/mediaRequests/fileDownload';
import { judgeForRequest } from '@ValenceRequests/mediaRequests/judgeForRequest';
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
import type {
  IndexerSearchReport,
  Release,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type {
  MediaRequest,
  MediaRequestDraft,
  MissingSearch,
} from '@ValenceContracts/schemas/MediaRequest';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { ProbeClient } from '@ValenceRequests/media/createProbeClient';
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
  stalledForMs?: number;
  metadataForMs?: number;
  settlesForMs?: number;
  wouldTakeLongerThanMs?: number;
  say?: (line: string) => void;
};

type Found = { request: MediaRequestRecord; items: RequestItemRecord[] };

const TICK_EVERY_MS = 30_000;

const MISSING_EVERY_MS = 6 * 60 * 60 * 1000;

const FIRST_MISSING_AFTER_MS = 2 * 60 * 1000;

const FEEDS_EVERY_MS = 15 * 60 * 1000;

const STALLED_FOR_MS = 6 * 60 * 60 * 1000;

const METADATA_FOR_MS = 5 * 60 * 1000;

const SETTLES_FOR_MS = 15 * 60 * 1000;

const WOULD_TAKE_LONGER_THAN_MS = 7 * 24 * 60 * 60 * 1000;

const NUDGE_AFTER_MS = 1000;

const MOST_FILING_ATTEMPTS = 5;

const MOST_ALIASES_SEARCHED = 2;

const NOTHING_FOUND = 'Nothing acceptable has been found yet';

const LIBRARY_KINDS_OF: Record<MediaRequestRecord['kind'], LibraryKind> = {
  film: 'movies',
  series: 'shows',
  artist: 'music',
  album: 'music',
  book: 'books',
};

const IN_FLIGHT = new Set<RequestItemRecord['state']>([
  'searching',
  'chosen',
  'downloading',
  'filing',
]);

const DEFAULT_PROFILES: Record<QualityProfile['kind'], QualityProfile> = {
  video: {
    ...QualityProfileDraftSchema.parse({ name: 'Default', kind: 'video' }),
    id: '00000000-0000-4000-8000-000000000000',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
  music: {
    ...QualityProfileDraftSchema.parse({ name: 'Default', kind: 'music' }),
    id: '00000000-0000-4000-8000-000000000001',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
};

/**
 * Says why a finished download could not be filed, and whether it counts as a try. Most often this
 * service does not see the download where its client says it put it, which a folder set on the
 * client puts right — so that is not held against the download, which is filed once it can be seen.
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
): { problem: string; isATry: boolean } =>
  error !== null && 'code' in error && error.code === 'ENOENT'
    ? {
        problem: `Valence cannot see ${path}, where ${clientName} put it. Set where ${clientName} saves downloads, as it sees them and as Valence does, on the Downloads page.`,
        isATry: false,
      }
    : { problem: `It could not be filed: ${error?.message ?? 'no reason given'}`, isATry: true };

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
 * @param stalledForMs - How long a download may stall before another release is tried.
 * @param metadataForMs - How long a torrent has to learn what it holds before it is given up on.
 * @param settlesForMs - How long a download runs before it is judged on how fast it is going.
 * @param wouldTakeLongerThanMs - How long a download may still have left before it is given up on.
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
  stalledForMs = STALLED_FOR_MS,
  metadataForMs = METADATA_FOR_MS,
  settlesForMs = SETTLES_FOR_MS,
  wouldTakeLongerThanMs = WOULD_TAKE_LONGER_THAN_MS,
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

  const note = async (request: MediaRequestRecord, message: string) => {
    await log.add(request.id, message);
    say(`${request.title}: ${message}`);
  };

  const approved = async (): Promise<Found[]> => {
    const [kept, waiting] = await Promise.all([requests.list(), items.list()]);

    return kept
      .filter((request) => request.approval === 'approved')
      .map((request) => ({
        request,
        items: waiting.filter((item) => item.requestId === request.id),
      }));
  };

  const searchedByItself = async (): Promise<Found[]> =>
    (await approved()).filter(
      (found) => !found.request.isPickedByHand && !isBookRequest(found.request.kind),
    );

  const profileFor = async (request: MediaRequestRecord): Promise<QualityProfile> =>
    chooseProfile(request, await profiles.list()) ??
    DEFAULT_PROFILES[isMusicRequest(request.kind) ? 'music' : 'video'];

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
      libraryKind: LIBRARY_KINDS_OF[request.kind],
      sizeBytes: release.sizeBytes,
      indexerName: release.indexerName,
      minimumSeedSeconds: release.minimumSeedSeconds,
      minimumRatio: release.minimumRatio,
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
    return null;
  };

  const fetchFrom = async (
    { request, items: all }: Found,
    releases: readonly Release[],
    isFetching: (item: RequestItemRecord) => boolean,
  ): Promise<{ isSent: boolean; said: string }> => {
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
    const forIt = judged.releases.length;

    if (picked === undefined || holding === undefined || score === undefined) {
      const best = judged.releases[0];
      const why = judged.judgements[0]?.rejections.join('; ');

      return {
        isSent: false,
        said:
          best === undefined || why === undefined
            ? `none of the ${releases.length.toString()} found were for it`
            : `${forIt.toString()} of them for it, and none would do — the best, ${best.title}, because ${why}`,
      };
    }

    const problem = await send(request, picked, holding, score.score);

    return problem === null
      ? { isSent: true, said: `chose ${picked.title}, the best of ${forIt.toString()} for it` }
      : { isSent: false, said: `chose ${picked.title}, but could not send it: ${problem}` };
  };

  const describeSearch = (search: ReleaseSearch): string => {
    if (search.album !== undefined) {
      return `“${search.album}”`;
    }

    return search.season === undefined
      ? 'it'
      : search.episode === undefined
        ? `season ${search.season.toString()}`
        : `S${search.season.toString().padStart(2, '0')}E${search.episode.toString().padStart(2, '0')}`;
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
        const unanswered = outcome.indexers.filter((report) => report.problem !== null);

        await note(
          found.request,
          [
            `Searched for ${describeSearch(search)}${query === search.query || query === queries[0] ? '' : ` as “${query}”`}`,
            outcome.indexers.length === 0
              ? ': no indexer is switched on'
              : `: ${outcome.releases.length.toString()} found by ${outcome.indexers.length.toString()} indexer${outcome.indexers.length === 1 ? '' : 's'}, ${fetched.said}`,
            ...unanswered.map(
              (report) => `. ${report.indexerName} could not answer: ${report.problem ?? ''}`,
            ),
            '.',
          ].join(''),
        );

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
        request.kind === 'film' || request.kind === 'album'
          ? 'It is out, and wanted.'
          : `${out.length.toString()} ${request.kind === 'artist' ? 'album' : 'episode'}${out.length === 1 ? ' is' : 's are'} out, and wanted.`,
      );
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

        await note(
          request,
          'Its download was taken out before it finished, so it is wanted again.',
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
        metadataForMs,
        stalledForMs,
        settlesForMs,
        wouldTakeLongerThanMs,
      });

      if (!judged.isDoomed) {
        continue;
      }

      const reason = judged.reason ?? 'The download failed';

      await block(request.id, download.title, fetching[0]?.indexerId ?? null, reason);
      await queue.remove(download.id, true);

      for (const item of fetching) {
        await update(item, letGo(item, `${reason}. Trying the next best release.`));
      }

      await note(
        request,
        `${download.title} failed: ${reason}. It is blocklisted, and the next best is looked for.`,
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
          await update(item, letGo(item, 'The download was taken out before it was filed'));
        }

        continue;
      }

      const attempts = (filing[0]?.attempts ?? 0) + 1;

      const retryOrFail = async (problem: string, isATry = true) => {
        if (filing[0]?.problem !== problem) {
          await note(request, `${download.title} could not be filed: ${problem}`);
        }

        for (const item of filing) {
          await (!isATry
            ? update(item, { problem })
            : attempts >= MOST_FILING_ATTEMPTS
              ? giveUp(request, item, problem)
              : update(item, { problem, attempts }));
        }
      };

      if (download.contentPath === null) {
        await retryOrFail(`${client.name} has not said where it put the download`);
        continue;
      }

      const path = mapClientPath(download.contentPath, client);

      try {
        const { filed, missing } = await (isMusicRequest(request.kind)
          ? fileMusic(request, filing, path, download.protocol === 'torrent')
          : isBookRequest(request.kind)
            ? fileBooks(request, filing, path, download.protocol === 'torrent')
            : file(request, filing, path, download.protocol === 'torrent', probe));

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
                ...downloadFacts(download),
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
            `Filed ${filed.size.toString()} from ${download.title} into ${folder}.`,
          );
        }
      } catch (error) {
        const why = whyNotFiled(error instanceof Error ? error : null, path, client.name);

        await retryOrFail(why.problem, why.isATry);
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
      into,
      wanted.map((one) => ({ ...one, title: '', airDate: null, filePath: null, releaseTitle })),
      path,
      protocol === 'torrent',
      probe,
    );

    return filed.size === 0 ? null : libraryFolderOf(into);
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

      const couldNot = async (problem: string, isATry = true) => {
        await downloads.update(download.id, {
          filingProblem: problem,
          filingAttempts: download.filingAttempts + (isATry ? 1 : 0),
          updatedAt: at(),
        });
      };

      if (client === undefined || download.contentPath === null) {
        await couldNot(`${client?.name ?? 'Its client'} has not said where it put the download`);
        continue;
      }

      if (parsed.title === '') {
        await couldNot('Its name does not say what it is');
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
              ? 'No track in it could be filed'
              : download.libraryKind === 'books'
                ? 'No book in it could be filed'
                : 'No video in it could be filed',
          );
          continue;
        }

        await downloads.update(download.id, {
          filedInto: folder,
          filingProblem: null,
          updatedAt: at(),
        });
        await events.add({
          kind: 'imported',
          title: download.title,
          libraryId: download.libraryId ?? '',
          folder,
        });
        say(`Filed ${download.title} into ${folder}.`);
      } catch (error) {
        const why = whyNotFiled(error instanceof Error ? error : null, path, client.name);

        await couldNot(why.problem, why.isATry);
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

      for (const found of await searchedByItself()) {
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

      for (const found of await searchedByItself()) {
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
        (await searchedByItself()).map(async (found) => {
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
        const fetched = await fetchFrom(found, outcome.releases, isFetching);

        if (fetched.isSent) {
          await note(found.request, `Among the newest releases, ${fetched.said}.`);
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
          },
        ];
      case 'series':
        return [
          { query, mode: 'tv' },
          ...seasons.map((season) => ({ query, mode: 'tv' as const, season })),
        ];
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
      blocked: blockedList,
      priorities: await priorities(),
      isFetching: (item) => !IN_FLIGHT.has(item.state),
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

  return {
    tick,

    searchMissing,

    pollFeeds,

    dropDownloads: (id: string): Promise<number> =>
      serially(async () => {
        const unfinished = [
          ...new Set(
            (await items.list()).flatMap((item) =>
              item.requestId === id &&
              item.downloadId !== null &&
              (item.state === 'chosen' || item.state === 'downloading' || item.state === 'filing')
                ? [item.downloadId]
                : [],
            ),
          ),
        ];

        for (const downloadId of unfinished) {
          await queue.remove(downloadId, true).catch(() => false);
        }

        return unfinished.length;
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
          items: syncItems(request, draft.catalogue, []).add.map((one) => ({
            ...itemFromDraft(one, randomUUID(), request.id, at()),
            state: 'wanted',
          })),
        },
        [],
      );
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
            : `That release holds no ${isMusicRequest(found.request.kind) ? 'album' : 'episode'} this request is waiting for`;
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

        await note(found.request, `${picked.title} was picked by hand.`);

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
