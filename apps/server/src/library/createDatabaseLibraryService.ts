import { firstAnswerOf } from '@ValenceServer/library/firstAnswerOf';
import { createVersionChoices } from './createVersionChoices';
import { createPatternRenames } from '@ValenceServer/rename/createPatternRenames';
import { underAnyOf } from '@ValenceServer/library/underAnyOf';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { readStoredCertifications } from '@ValenceServer/library/readStoredCertifications';
import { askForLibraryWork } from '@ValenceServer/library/askForLibraryWork';
import { artworkRevisionOf } from '@ValenceServer/library/artworkRevisionOf';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import { createArtworkChoices } from '@ValenceServer/library/createArtworkChoices';
import { createTitleEditStore } from '@ValenceServer/metadata/createTitleEditStore';
import { overlayShowEdits } from '@ValenceServer/metadata/overlayShowEdits';
import { jobBehindTheKey } from '@ValenceServer/library/jobBehindTheKey';
import { randomUUID } from 'node:crypto';
import { rm, stat } from 'node:fs/promises';
import { stacksIn } from './placement/stacksIn';
import { isMediaFile } from './isMediaFile';
import { isUnderAny } from './isUnderAny';
import { z } from 'zod';
import {
  and,
  asc,
  desc,
  eq,
  count,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { truth } from '@ValenceDatabase/truth';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { countAffected } from '@ValenceDatabase/countAffected';
import { floorDivided } from '@ValenceDatabase/floorDivided';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { jsonContains } from '@ValenceDatabase/jsonContains';
import { adviceFor } from '@ValenceServer/library/adviceFor';
import { audioTracksWanted } from '@ValenceServer/library/audioTracksWanted';
import { audioFacetsOf } from '@ValenceServer/library/audioFacetsOf';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import { jsonObjectElements } from '@ValenceDatabase/jsonObjectElements';
import { jsonTextElements } from '@ValenceDatabase/jsonTextElements';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { upsert } from '@ValenceDatabase/upsert';
import {
  ageCeiling,
  ageException,
  book,
  bookChapter,
  continueWatchingDismissal,
  library,
  libraryBlock,
  mediaItem,
  mediaPart,
  musicTrack,
  watchProgress,
  mediaOverride,
  mediaPreviewOverride,
  series,
  episodePin,
  seasonSource,
  wordRule,
  extraChoice,
  jobRunIssue,
} from '#dialect/Schema';
import {
  LibraryKindSchema,
  MediaDetailSchema,
  MediaSummarySchema,
} from '@ValenceContracts/schemas/Library';
import { AudioStreamSchema } from '@ValenceContracts/schemas/MediaItem';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import {
  createMediaStore,
  listOutstandingFor,
  markJobComplete,
  clearJobCompletion,
  clearJobCompletions,
} from './createMediaStore';
import { previewRequestFor } from './previewRequestFor';
import { fetchLogos } from './fetchLogos';
import { scanLibrary } from './scanLibrary';
import { marksFromProbe } from '@ValenceServer/books/marksFromProbe';
import { scanBookLibrary } from '@ValenceServer/books/scanBookLibrary';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';
import type { BookStore } from '@ValenceServer/books/scanBookLibrary';
import { scanMusicLibrary } from '@ValenceServer/music/scanMusicLibrary';
import { yourStars } from '@ValenceServer/library/yourStars';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import type {
  MusicArtwork,
  MusicFileSystem,
  MusicStore,
} from '@ValenceServer/music/scanMusicLibrary';
import { readEveryEpisode } from '@ValenceServer/library/readEveryEpisode';
import { groupIntoShows, buildShowDetail } from './groupIntoShows';
import { episodeEntryId } from '@ValenceServer/calendar/episodeEntryId';
import { catalogueTitleKey } from '@ValenceServer/calendar/catalogueTitleKey';
import { createAnswerKeeper } from '@ValenceServer/sources/createAnswerKeeper';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';
import { resolveAiringSeason, resolveNextEpisode, resolveSeriesShape } from './MetadataProvider';
import { seasonSourcesOfFile } from './seasonSourcesOfFile';
import { folderOfSeriesKey } from './folderOfSeriesKey';
import { nextEpisodeOf } from '@ValenceServer/library/nextEpisodeOf';
import { regeneratePreviews } from './regeneratePreviews';
import { generateTrickplay } from './generateTrickplay';
import { rebuildItemArtefacts } from './rebuildItemArtefacts';
import { moveMediaFile } from '@ValenceServer/library/moveMediaFile';
import { deleteMediaFile } from '@ValenceServer/library/deleteMediaFile';
import { keptCopiesOf } from '@ValenceServer/library/keptCopiesOf';
import type { MediaFileDeletion } from '@ValenceServer/library/deleteMediaFile';
import { clearLibraryParts } from './clearLibraryParts';
import { createClearableLibrary } from './createClearableLibrary';
import { readsAgainAfterClearing } from '@ValenceCore/functions/readsAgainAfterClearing';
import { LIBRARY_PARTS_BY_KIND } from '@ValenceContracts/schemas/LibraryPart';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import { toIso } from '@ValenceCore/functions/toIso';
import {
  TRICKPLAY_INTERVAL_SECONDS,
  TRICKPLAY_TILE_WIDTH,
  TRICKPLAY_COLUMNS,
  TRICKPLAY_ROWS,
} from '@ValenceServer/playback/PlaybackService';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  Library,
  LibraryKind,
  MediaDetail,
  MediaSummary,
  PreviewMoment,
  ScanResult,
} from '@ValenceContracts/schemas/Library';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { MediaFileSystem, ScanPhase, ScannedItem } from './scanLibrary';
import type {
  AiringSeason,
  CatalogueDescription,
  MetadataProvider,
  SeriesShape,
} from './MetadataProvider';
import { LINKED_SCHEME } from '@ValenceServer/linking/catalogue/LINKED_SCHEME';
import type { CatalogueArtwork } from '@ValenceServer/calendar/CatalogueArtwork';
import type { CatalogueTitleRef } from '@ValenceServer/calendar/CatalogueTitleRef';
import type { NextEpisode } from '@ValenceServer/library/nextEpisodeOf';
import type { ShowDetail, ShowSummary, UpNext } from '@ValenceContracts/schemas/Show';
import { isWorthResuming } from '@ValenceContracts/schemas/WatchProgress';
import { nextEpisode } from '@ValenceCore/functions/nextEpisode';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { reachableByViewer } from '@ValenceServer/visibility/reachableByViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type {
  AgeExceptionEntry,
  LibraryService,
  ListItemsOptions,
  SeriesDeletion,
} from './LibraryService';
import {
  SCAN_LIBRARY_JOB,
  READ_AGAIN_JOB,
  REGENERATE_PREVIEWS_JOB,
  REGENERATE_TRICKPLAY_JOB,
  FETCH_LOGOS_JOB,
  DETECT_SEGMENTS_JOB,
  CLEAR_LIBRARY_PARTS_JOB,
  CLEANUP_ARTEFACT_CACHE_JOB,
} from '@ValenceServer/jobs/JobQueue';
import type { JobQueue } from '@ValenceServer/jobs/JobQueue';
import { filesAtOnce } from '@ValenceServer/library/filesAtOnce';

const DECADE = 10;

type PreviewSubject = {
  id: string;
  libraryId: string;
  path: string;
  durationSeconds: number;
  audioStreams: AudioStream[];
  generation: number;
  defaultAudioLanguage: string | null;
  previewMoment: PreviewMoment | null;
};

type CreateDatabaseLibraryServiceOptions = {
  atOnce?: number;
  db: AnyValenceDatabase;
  files: MediaFileSystem;
  transcoder: Transcoder;
  forcedAccel?: () => Promise<string>;
  jobs: JobQueue;
  previewQuality?: () => Promise<PreviewQuality>;
  usesKeyframeThumbnails?: () => Promise<boolean>;
  certificationRegion?: () => Promise<string>;
  providers?: MetadataProvider[];
  books?: BookStore;
  nameChapters?: (libraryId: string) => Promise<number>;
  images?: { forget: (url: string) => Promise<void> };
  artworkUploads?: string;
  music?: {
    store: MusicStore;
    artwork: MusicArtwork;
    files: Omit<MusicFileSystem, 'listFiles'>;
  };
  onProblem?: (path: string, reason: Said) => void;
  onArrived?: (libraryId: string, item: ScannedItem) => void;
  onDeparted?: (libraryId: string, items: ScannedItem[]) => void;
  onDeleted?: (libraryId: string, removed: number) => void;
  onArtworkChanged?: (mediaIds: string[]) => void;
  forgetKeptCopies?: (paths: string[]) => Promise<void>;
};

const LIBRARY_COLUMNS = {
  id: library.id,
  name: library.name,
  kind: library.kind,
  flavour: library.flavour,
  path: library.path,
  lastScannedAt: library.lastScannedAt,
  lastScanAdded: library.lastScanAdded,
  lastScanUpdated: library.lastScanUpdated,
  lastScanRemoved: library.lastScanRemoved,
  lastScanFailed: library.lastScanFailed,
  defaultAudioLanguage: library.defaultAudioLanguage,
  filesAtOnce: library.filesAtOnce,
  takesRequests: library.takesRequests,
  requestProfileId: library.requestProfileId,
  requestPath: library.requestPath,
  keepsShowsTogether: library.keepsShowsTogether,
  metadataLanguage: library.metadataLanguage,
  usesOriginalTitle: library.usesOriginalTitle,
  writesNfo: library.writesNfo,
  higherProfileAsks: library.higherProfileAsks,
  requestFulfilment: library.requestFulfilment,
  linkedServerId: library.linkedServerId,
};

/**
 * Builds the condition a typed search matches on: the title, the series title, the description, the
 * tagline and the cast. Somebody typing into a search box is naming whatever they can remember, and
 * the title is only sometimes it — an actor's name and half a plot are both perfectly ordinary ways
 * to look for a film.
 *
 * @param search - What was typed.
 * @returns The condition to add to the query.
 */
const matchesSearch = (search: string) => {
  const like = `%${search.trim()}%`;
  const member = jsonObjectElements(mediaItem.castMembers, 'member', { name: 'text' });

  return or(
    containsInsensitively(mediaItem.title, like),
    containsInsensitively(mediaItem.seriesTitle, like),
    containsInsensitively(mediaItem.overview, like),
    containsInsensitively(mediaItem.tagline, like),
    sql`(select count(*) from ${member.rows} where ${containsInsensitively(member.field('name'), like)}) > 0`,
  );
};

type ReadAgainOutcome = {
  mediaIds: string[];
  heldAs: ReadonlyMap<string, string | null>;
};

type DatabaseLibraryService = LibraryService & {
  runScan: (libraryId: string, force?: boolean, jobId?: string) => Promise<ScanResult | null>;
  runReadAgain: (
    libraryId: string,
    paths: string[],
    jobId?: string,
    keepsMatches?: boolean,
  ) => Promise<ReadAgainOutcome>;
  runScanFolder: (libraryId: string, folder: string, jobId?: string) => Promise<ScanResult | null>;
  findByCatalogueId: (
    libraryId: string,
    kind: 'film' | 'series',
    externalId: string,
  ) => Promise<string | null>;
  runRegeneratePreviews: (
    libraryId: string,
    defaultAudioLanguage: string | null,
    jobId?: string,
  ) => Promise<void>;
  runRegenerateTrickplay: (libraryId: string, jobId?: string) => Promise<void>;
  runFetchLogos: (libraryId: string, jobId?: string) => Promise<void>;
  runClearParts: (libraryId: string, parts: LibraryPart[], jobId?: string) => Promise<void>;
};

const EPISODES_AT_A_TIME = 2000;

const MOST_EPISODES_SHARED = 2000;

const CREDITS_LIMIT = 200;

const SERIES_SHAPE_LIVES_FOR_MS = 6 * 60 * 60 * 1000;

const COMING_UP_SHOWN = 40;

const UP_NEXT_SHOWN = 20;

const UP_NEXT_LOOKS_BACK_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * How well an item's title answers a search, as the database works it out: 0 where the title or its
 * series is exactly what was typed, 1 where it starts with it, 2 where one of its words does, 3
 * where it holds it anywhere, and 4 where only the description, tagline or cast matched. The same
 * ranks as `searchRankOf`, so the page leads with what the client would put first.
 *
 * @param search - What was typed.
 * @returns The rank, as a value the query can order by.
 */
const searchRank = (search: string) => {
  const said = search.trim();
  const names = [mediaItem.title, mediaItem.seriesTitle];
  const any = (pattern: string, compare: 'equals' | 'like') =>
    or(
      ...names.map((name) =>
        compare === 'equals'
          ? sql`lower(${name}) = lower(${pattern})`
          : containsInsensitively(name, pattern),
      ),
    );

  return sql<number>`case
    when ${any(said, 'equals')} then 0
    when ${any(`${said}%`, 'like')} then 1
    when ${any(`% ${said}%`, 'like')} then 2
    when ${any(`%${said}%`, 'like')} then 3
    else 4
  end`;
};

/**
 * Decides how a page of items is ordered. Ordering by a viewer's own rating puts the highest first
 * and anything unrated last, then falls back to the title so that everything they gave the same
 * number of stars still comes back in a stable order rather than whatever the database felt like.
 * A search puts the titles that answer it best first, the best rated among them leading, before
 * falling back to the order asked for.
 *
 * @param options - What the caller asked for, including whose ratings to order by.
 * @returns The ordering, as the clauses to apply in turn.
 */
const orderingFor = (options: ListItemsOptions) => {
  const byTitle = asc(sql`coalesce(${mediaItem.sortTitle}, ${mediaItem.title})`);

  if (options.search !== undefined && options.search.trim() !== '') {
    return [
      asc(searchRank(options.search)),
      nullsLast(mediaItem.rating, 'desc'),
      byTitle,
      asc(mediaItem.id),
    ];
  }

  if (options.order === 'yourRating' && options.profileId !== undefined) {
    return [nullsLast(yourStars(options.profileId), 'desc'), byTitle, asc(mediaItem.id)];
  }

  return [options.order === 'newest' ? desc(mediaItem.addedAt) : byTitle, asc(mediaItem.id)];
};

const FOLDERS_ASKED_AT_ONCE = 200;

/**
 * The library as Postgres holds it, and the work the job queue runs against it — scanning, probing,
 * fetching artwork, building previews. Item detail is validated on the way out with the shared
 * contract schema, so a row written by an older version fails here rather than reaching a client
 * half-populated.
 *
 * @param options - The database, the file system, the transcoder, the queue, and any metadata
 *   providers to ask about files.
 * @returns The library service, plus the worker bodies only a real library can run.
 */
const createDatabaseLibraryService = ({
  db,
  files,
  transcoder,
  forcedAccel,
  jobs,
  providers,
  books,
  nameChapters,
  images,
  artworkUploads,
  music,
  atOnce = 1,
  previewQuality = (): Promise<PreviewQuality> => Promise.resolve('high'),
  usesKeyframeThumbnails = () => Promise.resolve(false),
  certificationRegion = (): Promise<string> => Promise.resolve('GB'),
  onProblem,
  onArrived,
  onDeparted,
  onDeleted,
  onArtworkChanged,
  forgetKeptCopies = () => Promise.resolve(),
}: CreateDatabaseLibraryServiceOptions): DatabaseLibraryService => {
  const store = createMediaStore(db, certificationRegion, forgetKeptCopies);

  /**
   * The files of a library as its scans should see them: everything on the disk, less what an
   * administrator has left out of it, and less everything inside a folder left out. What was left
   * out is named too, so a scan removes it rather than keeping it as a file gone missing. Leaving
   * out one part of a film kept as several files leaves out the film, since a part left behind
   * would otherwise be read as a film of its own.
   *
   * @param libraryId - The library being scanned.
   * @returns The same file system, its listing narrowed.
   */
  const filesFor = (libraryId: string): typeof files => ({
    ...files,
    listFiles: async (within) => {
      const [walked, leftOut] = await Promise.all([
        files.listFiles(within),
        store.listLeftOut(libraryId),
      ]);
      const paths = leftOut.map((one) => one.path);

      if (paths.length === 0) {
        return walked;
      }

      const isUnderLeftOut = underAnyOf(paths);
      const stacked = new Set(
        [...stacksIn(walked.files.map((file) => file.path).filter(isMediaFile)).values()]
          .filter((stack) => stack.parts.some(isUnderLeftOut))
          .flatMap((stack) => stack.parts),
      );
      const isLeftOut = (path: string): boolean => stacked.has(path) || isUnderLeftOut(path);

      return {
        ...walked,
        files: walked.files.filter((file) => !isLeftOut(file.path)),
        leftOut: walked.files.filter((file) => isLeftOut(file.path)).map((file) => file.path),
      };
    },
  });

  const shapes = createAnswerKeeper<SeriesShape | null>(SERIES_SHAPE_LIVES_FOR_MS);
  const titleEdits = createTitleEditStore(db);

  const nextEpisodes = createAnswerKeeper<NextEpisode | null>(SERIES_SHAPE_LIVES_FOR_MS);

  /**
   * Which of some programmes a profile has not yet finished every episode of.
   *
   * Up next looks for the episode after the last one finished, and a programme with every episode
   * finished has none. Those never leave a profile's history, so asking after them one at a time
   * would have a long-standing viewer pay for every programme they had ever finished each time the
   * home page opened; one counting query answers for all of them. Other versions of an episode and
   * extras are left out of the count, so watching
   * one of those leaves a programme in rather than wrongly out.
   *
   * @param profileId - Whose watching.
   * @param seriesIds - The programmes to ask about.
   * @returns Those with an episode left.
   */
  const seriesWithEpisodesLeft = async (
    profileId: string,
    seriesIds: string[],
  ): Promise<Set<string>> => {
    if (seriesIds.length === 0) {
      return new Set();
    }

    const counted = await db
      .select({
        seriesId: mediaItem.seriesId,
        episodes: count(mediaItem.id),
        finished: count(watchProgress.id),
      })
      .from(mediaItem)
      .leftJoin(
        watchProgress,
        and(
          eq(watchProgress.mediaItemId, mediaItem.id),
          eq(watchProgress.profileId, profileId),
          eq(watchProgress.isFinished, true),
        ),
      )
      .where(
        and(
          inArray(mediaItem.seriesId, seriesIds),
          isStillThere(),
          isNull(mediaItem.parentId),
          isNull(mediaItem.extraKind),
          ne(mediaItem.seasonNumber, 0),
        ),
      )
      .groupBy(mediaItem.seriesId);

    return new Set(
      counted.flatMap((row) =>
        row.seriesId !== null && row.finished < row.episodes ? [row.seriesId] : [],
      ),
    );
  };
  const airingSeasons = createAnswerKeeper<AiringSeason | null>(SERIES_SHAPE_LIVES_FOR_MS);
  const artworks = createAnswerKeeper<CatalogueArtwork>(SERIES_SHAPE_LIVES_FOR_MS);

  /**
   * What a programme is made of — its seasons and their episodes — as the catalogue has it.
   *
   * Remembered for six hours rather than for as long as the process runs. A show page would
   * otherwise cost a request per season every time somebody opened it, which is why it is
   * remembered at all; kept for ever, which is what this was, a season airing after the programme
   * was first looked at never appeared. The page that says what a library has is the same page that
   * says what it is missing, so it was wrong about both, and on a server that stays up for months
   * it stayed wrong.
   *
   * Six hours matches what the catalogue provider keeps its own answers for, deliberately.
   * Shortening this alone would buy nothing: the question would be asked again and served from the
   * cache underneath. See VAL-221.
   *
   * A programme whose files follow another of the catalogue's orders is laid out in that order,
   * as its files are numbered, and a season somebody said is another entry's is laid out from it.
   *
   * @param detail - The show being drawn.
   * @returns Its shape, or null where nothing identifies the programme.
   */
  const shapeOf = async (detail: ShowDetail): Promise<SeriesShape | null> => {
    const [row] = await db
      .select({ externalId: mediaItem.externalId, episodeOrder: series.episodeOrder })
      .from(mediaItem)
      .leftJoin(series, eq(series.id, mediaItem.seriesId))
      .where(eq(mediaItem.id, detail.coverMediaId))
      .limit(1);

    const externalId = row?.externalId ?? null;
    const order = row?.episodeOrder ?? null;

    if (externalId === null || externalId === '') {
      return null;
    }

    const borrowed = (await seasonSourcesOfFile(db, detail.coverMediaId))?.sources ?? [];
    const asked = [
      ...(order === null ? [] : [`order=${order}`]),
      ...borrowed.map(
        (one) =>
          `season${one.seasonNumber.toString()}=${one.externalId}/${one.externalSeason.toString()}`,
      ),
    ];

    return shapes.keep(asked.length === 0 ? externalId : `${externalId}?${asked.join('&')}`, () =>
      resolveSeriesShape(
        providers ?? [],
        externalId,
        (provider, reason) => {
          onProblem?.(provider, reason);
        },
        order ?? undefined,
        borrowed,
      ),
    );
  };

  /**
   * Reads a programme's own extras — the trailer above the seasons rather than beside an episode.
   *
   * Asked for separately because a programme is made of its episodes and extras are deliberately
   * kept out of those: everything that lists a library filters them away, so a series trailer would
   * otherwise be scanned, stored, and never seen by anybody.
   *
   * @param viewer - Who is asking, so that what they may not see stays unseen.
   * @param libraryId - The library the programme sits in.
   * @param detail - The programme, identified by its series where it has one and by its title where
   *   the scanner could not resolve one.
   * @returns Its extras, trailers first.
   */
  const extrasOfShow = async (
    viewer: Viewer,
    libraryId: string,
    detail: ShowDetail,
  ): Promise<MediaSummary[]> => {
    const rows = await db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        title: mediaItem.title,
        year: mediaItem.year,
        durationSeconds: mediaItem.durationSeconds,
        width: mediaItem.width,
        height: mediaItem.height,
        videoCodec: mediaItem.videoCodec,
        videoRange: mediaItem.videoRange,
        addedAt: mediaItem.addedAt,
        posterUrl: mediaItem.posterUrl,
        artworkChangedAt: mediaItem.artworkChangedAt,
        backdropUrl: mediaItem.backdropUrl,
        extraKind: mediaItem.extraKind,
        parentId: mediaItem.parentId,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
      })
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, libraryId),
          isNotNull(mediaItem.extraKind),
          detail.seriesId === null
            ? eq(mediaItem.seriesTitle, detail.title)
            : eq(mediaItem.seriesId, detail.seriesId),
          visibleToViewer(db, viewer),
        ),
      )
      .orderBy(asc(mediaItem.extraKind), asc(mediaItem.title));

    return z.array(MediaSummarySchema).parse(
      rows.map(({ posterUrl, backdropUrl, artworkChangedAt, ...extra }) => ({
        ...extra,
        ...artworkRevisionOf(artworkChangedAt),
        addedAt: extra.addedAt.toISOString(),
        hasPoster: posterUrl !== null,
        posterUrl,
        hasBackdrop: backdropUrl !== null,
        hasLogo: false,
      })),
    );
  };

  /**
   * Reads what one item's preview request is built from, with the moment somebody chose for it
   * where there is one.
   *
   * @param mediaId - The item.
   * @returns The subject, or null where there is no such item.
   */
  const previewSubjectOf = async (mediaId: string): Promise<PreviewSubject | null> => {
    const rows = await db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        path: mediaItem.path,
        durationSeconds: mediaItem.durationSeconds,
        audioStreams: mediaItem.audioStreams,
        generation: library.generation,
        defaultAudioLanguage: library.defaultAudioLanguage,
        atSeconds: mediaPreviewOverride.atSeconds,
        clipSeconds: mediaPreviewOverride.durationSeconds,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(
        mediaPreviewOverride,
        and(
          eq(mediaPreviewOverride.libraryId, mediaItem.libraryId),
          eq(mediaPreviewOverride.path, mediaItem.path),
        ),
      )
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    const row = rows[0];

    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      libraryId: row.libraryId,
      path: row.path,
      durationSeconds: row.durationSeconds,
      audioStreams: z.array(AudioStreamSchema).parse(row.audioStreams),
      generation: row.generation,
      defaultAudioLanguage: row.defaultAudioLanguage,
      previewMoment:
        row.atSeconds === null
          ? null
          : { atSeconds: row.atSeconds, durationSeconds: row.clipSeconds },
    };
  };

  /**
   * Throws away the clip an item was previewed with and asks for the one it should be previewed
   * with now, without waiting for the render — the next hover, or the regenerate job, collects it.
   *
   * @param subject - The item, as a preview request is built from it.
   * @param from - The moment the old clip was cut from.
   * @param to - The moment the new clip is to be cut from.
   */
  const recutPreview = async (
    subject: PreviewSubject,
    from: PreviewMoment | null,
    to: PreviewMoment | null,
  ): Promise<void> => {
    const quality = await previewQuality();
    const chosenAccel = (await forcedAccel?.()) ?? '';
    const requestWith = (moment: PreviewMoment | null) =>
      previewRequestFor(
        { ...subject, previewMoment: moment },
        subject.generation,
        subject.defaultAudioLanguage,
        quality,
      );

    await transcoder.forgetPreview(requestWith(from)).catch((error: Error) => {
      onProblem?.(subject.path, sayVerbatim(error.message));

      return false;
    });

    await clearJobCompletion(db, subject.id, REGENERATE_PREVIEWS_JOB);

    await transcoder
      .requestPreview({
        ...requestWith(to),
        ...(chosenAccel === '' ? {} : { hardwareAccel: chosenAccel }),
        wait: false,
      })
      .catch((error: Error) => {
        onProblem?.(subject.path, sayVerbatim(error.message));

        return null;
      });
  };

  /**
   * Finds every file a correction should reach. Correcting one episode corrects the whole
   * programme: an identifier names a show, and fixing episode one while two to ten still point at
   * the wrong programme is worse than not offering the feature.
   *
   * @param db - The database to ask.
   * @param mediaId - The item somebody corrected.
   * @returns The paths of every file the correction applies to.
   */
  const pathsOfTheSameThing = async (
    mediaId: string,
  ): Promise<{ libraryId: string; paths: string[] } | null> => {
    const [row] = await db
      .select({
        libraryId: mediaItem.libraryId,
        path: mediaItem.path,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
      })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    if (row === undefined) {
      return null;
    }

    if (row.seriesTitle === null || row.seriesTitle === '') {
      return { libraryId: row.libraryId, paths: [row.path] };
    }

    const siblings = await db
      .select({ path: mediaItem.path })
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, row.libraryId),
          row.seriesId === null
            ? eq(mediaItem.seriesTitle, row.seriesTitle)
            : eq(mediaItem.seriesId, row.seriesId),
        ),
      );

    return { libraryId: row.libraryId, paths: siblings.map((one) => one.path) };
  };

  /**
   * Reads a few named files again, now that a correction has said what they are, and writes what
   * the catalogue answers back over what was stored.
   *
   * The scan is told the library's own root even though it reads only these files, because the root
   * decides the folder each programme is filed under, and the scan places every file in the library
   * again, not only these. A film kept as several files is handed over as every part, so it is read
   * as the one film it is rather than as its first part alone.
   *
   * @param libraryId - The library the files are in.
   * @param paths - The files to read again.
   * @param onProgress - The job to report progress against, where one is watching.
   * @param keepsMatches - Whether each file keeps the entry it is matched to, rather than being
   *   matched again from its name.
   */
  const readAgain = async (
    libraryId: string,
    paths: string[],
    onProgress?: (phase: ScanPhase, processed: number, total: number) => void,
    keepsMatches = false,
  ): Promise<void> => {
    const items = await db
      .select({
        id: mediaItem.id,
        path: mediaItem.path,
        sizeBytes: mediaItem.sizeBytes,
        modifiedAtMs: mediaItem.modifiedAtMs,
      })
      .from(mediaItem)
      .where(
        and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, paths), isStillThere()),
      );
    const parts =
      items.length === 0
        ? []
        : await db
            .select({
              mediaItemId: mediaPart.mediaItemId,
              path: mediaPart.path,
              sizeBytes: mediaPart.sizeBytes,
              modifiedAtMs: mediaPart.modifiedAtMs,
            })
            .from(mediaPart)
            .where(
              inArray(
                mediaPart.mediaItemId,
                items.map((item) => item.id),
              ),
            );
    const split = new Set(parts.map((part) => part.mediaItemId));
    const rows = [...items.filter((item) => !split.has(item.id)), ...parts].map(
      ({ path, sizeBytes, modifiedAtMs }) => ({ path, sizeBytes, modifiedAtMs }),
    );

    const found = await findLibrary(libraryId);

    if (found === null) {
      return;
    }

    await scanLibrary({
      libraryId,
      metadataLanguage: found.metadataLanguage ?? null,
      usesOriginalTitle: found.usesOriginalTitle,
      kind: found.kind === 'anime' ? 'anime' : found.kind === 'shows' ? 'shows' : 'movies',
      root: found.path,
      files: {
        listFiles: () => Promise.resolve({ files: rows, unreadable: [] }),
        ...(files.readText === undefined ? {} : { readText: files.readText }),
      },
      store,
      transcoder,
      providers: providers ?? [],
      force: true,
      keepsMatches,
      reusesProbes: keepsMatches,
      isPartial: true,
      ...(onProblem === undefined ? {} : { onProblem }),
      ...(onProgress === undefined ? {} : { onProgress }),
    });
  };

  /**
   * Hands a re-read to the job queue rather than doing it in the request, so a correction that
   * reaches ninety episodes is something to watch rather than a request that hangs for as long as a
   * series takes to fetch.
   *
   * Where the queue already holds a re-read for this library, it does not fall back to the work in
   * the request, which is the one case it exists to avoid: a re-read with no job id appears in no
   * list of running work, reports no progress and cannot be stopped. It answers with the job that
   * is already reading instead, and the paths are picked up by the scan that follows — a re-read
   * works from what the files say, not from a list it was handed.
   *
   * @param libraryId - The library the files are in.
   * @param paths - The files to read again.
   * @param keepsMatches - Whether each file keeps the entry it is matched to.
   * @returns The job reading these files, or null where there is none and none could be started.
   */
  const queueReadAgain = async (
    libraryId: string,
    paths: string[],
    keepsMatches = false,
  ): Promise<string | null> => {
    const jobId = await jobs.enqueue(
      READ_AGAIN_JOB,
      keepsMatches ? { libraryId, paths, keepsMatches } : { libraryId, paths },
      libraryId,
    );

    return jobId ?? (await jobs.liveJob(READ_AGAIN_JOB, libraryId));
  };

  /**
   * Gives files whose title has changed the new title's logo, since a scan reads a title again
   * without its logo, and the old title's would otherwise stay.
   *
   * @param files - The files whose title changed.
   */
  const relogo = async (
    files: readonly { id: string; externalId: string | null; seriesTitle: string | null }[],
  ): Promise<void> => {
    const readLogoUrl = (providers ?? []).find(
      (provider) => provider.readLogoUrl !== undefined,
    )?.readLogoUrl;
    const titles = new Map<
      string,
      { externalId: string | null; isSeries: boolean; ids: string[] }
    >();

    for (const file of files) {
      const key = `${file.seriesTitle === null ? 'movie' : 'tv'}:${file.externalId ?? ''}`;
      const title = titles.get(key) ?? {
        externalId: file.externalId,
        isSeries: file.seriesTitle !== null,
        ids: [],
      };

      title.ids.push(file.id);
      titles.set(key, title);
    }

    for (const title of titles.values()) {
      const logoUrl =
        title.externalId === null || readLogoUrl === undefined
          ? null
          : await readLogoUrl({ externalId: title.externalId, isSeries: title.isSeries }).catch(
              () => null,
            );

      await db.update(mediaItem).set({ logoUrl }).where(inArray(mediaItem.id, title.ids));
    }
  };

  const versionChoices = createVersionChoices(db);
  const patternRenames = createPatternRenames({ db, queueReadAgain });

  const artworkChoices = createArtworkChoices({
    db,
    readOptions: async (asked) => {
      const answers = await Promise.all(
        (providers ?? []).map(
          async (provider) =>
            (await provider.readArtworkOptions?.(asked).catch(() => null)) ?? null,
        ),
      );
      const [first, ...rest] = answers.filter((answer) => answer !== null);

      return first === undefined
        ? null
        : {
            poster: [...first.poster, ...rest.flatMap((one) => one.poster)],
            backdrop: [...first.backdrop, ...rest.flatMap((one) => one.backdrop)],
            logo: [...first.logo, ...rest.flatMap((one) => one.logo)],
          };
    },
    readOwn: (providers ?? []).find((provider) => provider.readOwnArtwork !== undefined)
      ?.readOwnArtwork,
    readPartOptions: (providers ?? []).find((provider) => provider.readPartArtwork !== undefined)
      ?.readPartArtwork,
    borrowedSeasonOf: async (mediaId, season) => {
      const found = (await seasonSourcesOfFile(db, mediaId))?.sources.find(
        (one) => one.seasonNumber === season,
      );

      return found === undefined
        ? null
        : { externalId: found.externalId, season: found.externalSeason };
    },
    readAgain: queueReadAgain,
    fetchLogos: (libraryId) => askForLibraryWork(jobs, FETCH_LOGOS_JOB, libraryId, { libraryId }),
    ...(onArtworkChanged === undefined ? {} : { onChanged: onArtworkChanged }),
    ...(artworkUploads === undefined ? {} : { uploads: artworkUploads }),
  });

  /**
   * A library to act on: scan, reset, move into, delete from and the rest. The hidden library
   * streamed films are kept in is never one, since nothing in it is a file.
   *
   * @param id - The library.
   * @returns The library, or null where there is none to act on.
   */
  const findLibrary = async (id: string) => {
    const rows = await db
      .select()
      .from(library)
      .where(and(eq(library.id, id), eq(library.isStreamed, false)))
      .limit(1);

    return rows[0] ?? null;
  };

  /**
   * What the profile looking has watched to the end, for how many episodes of each programme they
   * have left — nothing where nobody in particular is looking, since then there is no count to
   * give.
   *
   * @param viewer - Who is looking.
   * @returns The items finished, or nothing.
   */
  const finishedBy = async (viewer: Viewer): Promise<ReadonlySet<string> | undefined> => {
    if (viewer.kind !== 'account' || viewer.profileId === null) {
      return undefined;
    }

    const rows = await db
      .select({ mediaItemId: watchProgress.mediaItemId })
      .from(watchProgress)
      .where(
        and(eq(watchProgress.profileId, viewer.profileId), eq(watchProgress.isFinished, true)),
      );

    return new Set(rows.map((row) => row.mediaItemId));
  };

  /**
   * Deletes the files of the items that match, every part of a film kept as several files among
   * them, one library at a time, and forgets each as a scan would on finding it gone: the rows go,
   * a series left with nothing goes with them, whoever listens hears they departed, and the cache
   * is swept of what was made from them.
   *
   * Stops at the first file the disk will not give up, having forgotten the ones already deleted,
   * so the catalogue never holds a row for a file that is no longer there.
   *
   * @param which - The items whose files go.
   * @returns How many went, or why they stopped.
   */
  const deleteFilesWhere = async (which: SQL): Promise<SeriesDeletion> => {
    const items = await db
      .select({ id: mediaItem.id, path: mediaItem.path, libraryId: mediaItem.libraryId })
      .from(mediaItem)
      .where(which);

    if (items.length === 0) {
      return { kind: 'absent' };
    }

    let files = 0;

    for (const libraryId of new Set(items.map((item) => item.libraryId))) {
      const found = await findLibrary(libraryId);

      if (found === null) {
        continue;
      }

      const deletedPaths: string[] = [];
      let refusal: Exclude<MediaFileDeletion, { kind: 'deleted' }> | null = null;

      for (const item of items.filter((one) => one.libraryId === libraryId)) {
        const parts = await db
          .select({ path: mediaPart.path })
          .from(mediaPart)
          .where(eq(mediaPart.mediaItemId, item.id))
          .orderBy(asc(mediaPart.position));
        const [first = item.path, ...later] = parts.map((part) => part.path);
        const deleted = await deleteMediaFile(
          found.path,
          first,
          await keptCopiesOf(db, eq(mediaItem.id, item.id)),
          later,
        );

        if (deleted.kind !== 'deleted') {
          refusal = deleted;
          break;
        }

        deletedPaths.push(item.path);
      }

      const gone = await store.removeByPaths(found.id, deletedPaths);

      await store.forgetEmptySeries?.(found.id);

      if (gone.length > 0) {
        onDeparted?.(found.id, gone);
        onDeleted?.(found.id, gone.length);
      }

      files += deletedPaths.length;

      if (refusal !== null) {
        await jobs.enqueue(CLEANUP_ARTEFACT_CACHE_JOB, {}, CLEANUP_ARTEFACT_CACHE_JOB);

        return refusal;
      }
    }

    await jobs.enqueue(CLEANUP_ARTEFACT_CACHE_JOB, {}, CLEANUP_ARTEFACT_CACHE_JOB);

    return { kind: 'deleted', files };
  };

  /**
   * Whether a library exists as far as this viewer is concerned.
   *
   * Asked before a library's contents are listed, so that one an account may not reach — or one the
   * person watching has hidden — answers as though it were never there rather than as an empty
   * shelf. An empty shelf still says something exists, which is the thing this is for.
   *
   * @param viewer - Who is asking.
   * @param id - The library.
   * @returns Whether to admit it exists.
   */
  /**
   * What a library reads, so that asking it for the wrong sort of thing can answer with nothing.
   *
   * @param id - The library.
   * @returns What it holds, or null where there is no such library.
   */
  const kindOfLibrary = async (id: string): Promise<LibraryKind | null> => {
    const rows = await db
      .select({ kind: library.kind })
      .from(library)
      .where(eq(library.id, id))
      .limit(1);

    const held = rows[0]?.kind;

    if (held === undefined) {
      return null;
    }

    const read = LibraryKindSchema.safeParse(held);

    return read.success ? read.data : null;
  };

  /**
   * Whether a library is the hidden one streamed films are kept in, which is listed only for the
   * titles somebody asks for by id — what they are part way through and have watched.
   *
   * @param id - The library.
   * @returns Whether it is.
   */
  const isStreamedLibrary = async (id: string): Promise<boolean> => {
    const [row] = await db
      .select({ isStreamed: library.isStreamed })
      .from(library)
      .where(eq(library.id, id))
      .limit(1);

    return row?.isStreamed === true;
  };

  const libraryVisible = async (viewer: Viewer, id: string): Promise<boolean> => {
    const rows = await db
      .select({ one: sql<number>`1` })
      .from(library)
      .where(and(eq(library.id, id), librariesVisibleToViewer(db, viewer)))
      .limit(1);

    return rows.length > 0;
  };

  /**
   * Reads a library of films or programmes, by probing every file that changed.
   *
   * @param found - The library.
   * @param force - Whether to read everything again regardless of what has changed.
   * @param jobId - The job to report against, where this is one.
   * @returns What the scan changed.
   */
  const scanFilms = async (
    found: {
      id: string;
      path: string;
      kind: string;
      metadataLanguage?: string | null;
      usesOriginalTitle?: boolean;
    },
    force: boolean,
    jobId: string | undefined,
  ): Promise<ScanResult> =>
    scanLibrary({
      libraryId: found.id,
      metadataLanguage: found.metadataLanguage ?? null,
      usesOriginalTitle: found.usesOriginalTitle ?? false,
      kind: found.kind === 'anime' ? 'anime' : found.kind === 'shows' ? 'shows' : 'movies',
      root: found.path,
      files: filesFor(found.id),
      store,
      transcoder,
      force,
      atOnce: await filesAtOnceFor(found.id),
      ...(providers === undefined ? {} : { providers }),
      ...(onProblem === undefined ? {} : { onProblem }),
      ...(onArrived === undefined ? {} : { onAdded: (item) => onArrived(found.id, item) }),
      ...(onDeparted === undefined ? {} : { onRemoved: (items) => onDeparted(found.id, items) }),
      ...(jobId === undefined
        ? {}
        : {
            onProgress: (phase, processed, total, item) =>
              jobs.reportProgress(
                jobId,
                saying(`server.jobs.phase.${phase}`),
                processed,
                total,
                item ?? null,
              ),
            isCancelled: () => jobs.isCancelled(jobId),
          }),
    });

  /**
   * Reads a library of books, by opening every file that changed rather than probing it.
   *
   * A books library needs somewhere to put what it finds, and that is a service this one is given
   * rather than one it builds: the shelf knows how to read an archive and this does not, and a
   * server assembled without it simply has no books rather than a half-working scan.
   *
   * @param found - The library.
   * @param force - Whether to read everything again regardless of what has changed.
   * @param jobId - The job to report against, where this is one.
   * @returns What the scan changed, or nothing changed where this server has no shelf.
   */
  const scanBooks = async (
    found: { id: string; path: string },
    force: boolean,
    jobId: string | undefined,
  ): Promise<ScanResult> => {
    if (books === undefined) {
      return { added: 0, updated: 0, removed: 0, failed: 0 };
    }

    const result = await scanBookLibrary({
      libraryId: found.id,
      root: found.path,
      files: filesFor(found.id),
      store: books,
      force,
      readMarks: async (path, durationSeconds) =>
        marksFromProbe((await transcoder.probe(path)).chapters, durationSeconds),
      ...(onProblem === undefined ? {} : { onProblem }),
      ...(onArrived === undefined
        ? {}
        : {
            onAdded: (arrived) =>
              onArrived(found.id, {
                itemId: arrived.bookId,
                title: arrived.title,
                seriesTitle: null,
                seasonNumber: null,
                episodeNumber: null,
                year: arrived.year,
                posterUrl: null,
                overview: null,
                durationSeconds: null,
                genres: [],
                rating: null,
                quality: null,
              }),
          }),
      ...(jobId === undefined
        ? {}
        : {
            onProgress: (processed, total) =>
              jobs.reportProgress(jobId, saying('server.jobs.phase.probing'), processed, total),
            isCancelled: () => jobs.isCancelled(jobId),
          }),
    });

    void nameChapters?.(found.id).catch(() =>
      onProblem?.(
        found.path,
        saying('server.library.databaseLibraryService.itsChapterNamesCouldNotBe'),
      ),
    );

    return result;
  };

  /**
   * Reads a library of music, by reading each changed track's tags rather than probing it.
   *
   * Like books, music is written somewhere this service is given rather than builds, and a server
   * assembled without it has no music rather than a scan that throws every track away for having
   * no picture.
   *
   * @param found - The library.
   * @param force - Whether to read everything again regardless of what has changed.
   * @param jobId - The job to report against, where this is one.
   * @param isPartial - Whether only a folder of the library is read, such as an album just filed.
   * @returns What the scan changed, or nothing changed where this server keeps no music.
   */
  const scanMusic = async (
    found: { id: string; path: string },
    force: boolean,
    jobId: string | undefined,
    isPartial = false,
  ): Promise<ScanResult> => {
    if (music === undefined) {
      return { added: 0, updated: 0, removed: 0, failed: 0 };
    }

    return scanMusicLibrary({
      libraryId: found.id,
      root: found.path,
      files: { ...music.files, listFiles: filesFor(found.id).listFiles },
      store: music.store,
      artwork: music.artwork,
      force,
      isPartial,
      ...(onProblem === undefined ? {} : { onProblem }),
      ...(jobId === undefined
        ? {}
        : {
            onProgress: (processed, total) =>
              jobs.reportProgress(jobId, saying('server.jobs.phase.probing'), processed, total),
            isCancelled: () => jobs.isCancelled(jobId),
          }),
    });
  };

  let measured: Promise<number> | null = null;

  /**
   * Asks the media service how many hardware renders this machine will run at once, once.
   *
   * @returns What the machine proved, or zero where it has no hardware or could not be asked.
   */
  const rendersAtOnce = async (): Promise<number> => {
    measured ??= transcoder
      .capabilities()
      .then((found) => found.concurrentRenders)
      .catch(() => 0);

    return measured;
  };

  /**
   * Decides how many of a library's files to work on at once: what the library was configured with,
   * or what the server thinks it can manage. A library on a network share wants one — the files
   * arrive down one wire, and asking for four divides that wire four ways and adds seeking to it.
   *
   * @param libraryId - The library being worked on.
   * @returns How many files to render at the same time.
   */
  const filesAtOnceFor = async (libraryId: string): Promise<number> =>
    filesAtOnce((await findLibrary(libraryId))?.filesAtOnce ?? atOnce, await rendersAtOnce());

  /**
   * Reads what the last scan of a library actually changed. "Scanned an hour ago" and "scanned an
   * hour ago and removed two hundred items" answer the same question, and only the second tells an
   * operator their mount was missing.
   *
   * @param row - The library row as stored.
   * @returns The counts from the last scan, or null where none has run since Valence began
   *   recording.
   */
  const readLastScan = (row: {
    lastScanAdded: number | null;
    lastScanUpdated: number | null;
    lastScanRemoved: number | null;
    lastScanFailed: number | null;
  }): { lastScan: ScanResult } | Record<string, never> =>
    row.lastScanAdded === null ||
    row.lastScanUpdated === null ||
    row.lastScanRemoved === null ||
    row.lastScanFailed === null
      ? {}
      : {
          lastScan: {
            added: row.lastScanAdded,
            updated: row.lastScanUpdated,
            removed: row.lastScanRemoved,
            failed: row.lastScanFailed,
          },
        };

  /**
   * Every show the viewer may see, with the catalogue's identifier for it, which is what is asked
   * about when its episodes air.
   *
   * @param viewer - Who is asking.
   * @returns The shows the catalogue knows.
   */
  const showsInTheCatalogue = async (
    viewer: Viewer,
  ): Promise<{ show: ShowSummary; externalId: string }[]> => {
    const held = (await service.list(viewer)).filter((entry) => isEpisodicKind(entry.kind));

    const shows = (
      await Promise.all(held.map(async (entry) => service.listShows(viewer, entry.id)))
    ).flatMap((listed) => listed ?? []);

    if (shows.length === 0) {
      return [];
    }

    const covers = await db
      .select({ id: mediaItem.id, externalId: mediaItem.externalId })
      .from(mediaItem)
      .where(
        inArray(
          mediaItem.id,
          shows.map((show) => show.coverMediaId),
        ),
      );

    const externalIds = new Map(covers.map((cover) => [cover.id, cover.externalId]));

    return shows.flatMap((show) => {
      const externalId = externalIds.get(show.coverMediaId) ?? null;

      return externalId === null || externalId === '' ? [] : [{ show, externalId }];
    });
  };

  /**
   * The seasons of some series read from another show in the catalogue, so what airs in them is
   * looked for on that show and laid out under the series' own season.
   *
   * @param seriesIds - The series.
   * @returns Each series' borrowed seasons, by its id.
   */
  const borrowedSeasonsOf = async (
    seriesIds: readonly string[],
  ): Promise<
    Map<string, { seasonNumber: number; externalId: string; externalSeason: number }[]>
  > => {
    const rows =
      seriesIds.length === 0
        ? []
        : await db
            .select({
              seriesId: seasonSource.seriesId,
              seasonNumber: seasonSource.seasonNumber,
              externalId: seasonSource.externalId,
              externalSeason: seasonSource.externalSeason,
            })
            .from(seasonSource)
            .where(inArray(seasonSource.seriesId, [...new Set(seriesIds)]));
    const bySeries = new Map<
      string,
      { seasonNumber: number; externalId: string; externalSeason: number }[]
    >();

    for (const { seriesId, ...row } of rows) {
      bySeries.set(seriesId, [...(bySeries.get(seriesId) ?? []), row]);
    }

    return bySeries;
  };

  /**
   * Names one episode of one series, so the episodes held can be looked up as they are listed.
   *
   * @param seriesId - The series.
   * @param seasonNumber - The season.
   * @param episodeNumber - The episode.
   * @returns The name.
   */
  const heldKey = (seriesId: string, seasonNumber: number, episodeNumber: number): string =>
    `${seriesId}:${seasonNumber.toString()}:${episodeNumber.toString()}`;

  /**
   * Which episodes of some series are on disk, counting a file that holds two episodes as both.
   *
   * @param seriesIds - The series to look in.
   * @returns Each episode held, named by heldKey.
   */
  const episodesHeldOf = async (seriesIds: readonly string[]): Promise<Set<string>> => {
    if (seriesIds.length === 0) {
      return new Set();
    }

    const rows = await db
      .select({
        seriesId: mediaItem.seriesId,
        seasonNumber: mediaItem.seasonNumber,
        episodeNumber: mediaItem.episodeNumber,
        episodeNumberEnd: mediaItem.episodeNumberEnd,
      })
      .from(mediaItem)
      .where(and(inArray(mediaItem.seriesId, [...new Set(seriesIds)]), isStillThere()));

    return new Set(
      rows.flatMap((row) => {
        if (row.seriesId === null || row.seasonNumber === null || row.episodeNumber === null) {
          return [];
        }

        const last = Math.max(row.episodeNumber, row.episodeNumberEnd ?? row.episodeNumber);

        return Array.from({ length: last - row.episodeNumber + 1 }, (_, offset) =>
          heldKey(row.seriesId ?? '', row.seasonNumber ?? 0, (row.episodeNumber ?? 0) + offset),
        );
      }),
    );
  };

  /**
   * The season a series in the catalogue is airing, with its episodes' days and stills, asked of
   * the providers once and then kept for a while, since the release calendar asks for every series
   * at once and a season's dates seldom move.
   *
   * @param externalId - The series' id in the catalogue.
   * @returns The season, or null where no provider knows of one.
   */
  const airingSeasonOf = (externalId: string): Promise<AiringSeason | null> =>
    airingSeasons.keep(externalId, () =>
      resolveAiringSeason(providers ?? [], externalId, (provider, reason) => {
        onProblem?.(provider, reason);
      }),
    );

  /**
   * The catalogue's backdrop and logo for a title, for something asked for that the library does
   * not yet hold, taken from the first provider that knows the title and kept for a while.
   *
   * @param title - The title.
   * @returns Its pictures, each null where no provider has one.
   */
  const catalogueArtworkOf = (title: CatalogueTitleRef): Promise<CatalogueArtwork> =>
    artworks.keep(catalogueTitleKey(title), async () => {
      const { value: found, trouble } = await troubleWatch.contain(() => artworkFrom(title));

      if (trouble !== null && (found.backdropUrl === null || found.logoUrl === null)) {
        troubleWatch.report(trouble);
      }

      return found;
    });

  /**
   * What this server's own catalogue says of a film another server holds, so its page is described
   * here as this server describes its own — not as the other server happened to — or nothing where
   * no catalogue here knows it or can be asked.
   *
   * @param externalId - The film's id in the catalogue.
   * @returns What the catalogue says, or nothing.
   */
  const ownDescriptionOf = async (externalId: string): Promise<CatalogueDescription | null> => {
    for (const provider of providers ?? []) {
      if (provider.describeTitle === undefined) {
        continue;
      }

      try {
        const described = await provider.describeTitle(externalId, 'movie');

        if (described !== null) {
          return described;
        }
      } catch {
        troubleWatch.report({ source: provider.name, reason: 'faulty' });
      }
    }

    return null;
  };

  /**
   * Asks each provider for a title's backdrop and logo until both are found.
   *
   * @param title - The title.
   * @returns Its pictures, each null where no provider has one.
   */
  const artworkFrom = async (title: CatalogueTitleRef): Promise<CatalogueArtwork> => {
    const found: CatalogueArtwork = { backdropUrl: null, logoUrl: null };

    for (const provider of providers ?? []) {
      try {
        const [described, logo] = await Promise.all([
          found.backdropUrl === null && provider.describeTitle !== undefined
            ? provider.describeTitle(title.externalId, title.kind)
            : Promise.resolve(null),
          found.logoUrl === null && provider.readLogoUrl !== undefined
            ? provider.readLogoUrl({
                externalId: title.externalId,
                isSeries: title.kind === 'tv',
              })
            : Promise.resolve(null),
        ]);

        found.backdropUrl = found.backdropUrl ?? described?.backdropUrl ?? null;
        found.logoUrl = found.logoUrl ?? logo;
      } catch (error) {
        troubleWatch.report({ source: provider.name, reason: 'faulty' });
        onProblem?.(
          provider.name,
          error instanceof Error
            ? sayVerbatim(describeFailure(error))
            : saying('server.library.metadataProvider.providerFailed'),
        );
      }
    }

    return found;
  };

  const service: DatabaseLibraryService = {
    list: async (viewer) => {
      const [rows, titles, chapters] = await Promise.all([
        db
          .select(LIBRARY_COLUMNS)
          .from(library)
          .where(librariesVisibleToViewer(db, viewer))
          .orderBy(asc(library.name)),
        db
          .select({
            libraryId: mediaItem.libraryId,
            itemCount:
              sql<number>`count(case when ${mediaItem.parentId} is null then 1 end)`.mapWith(
                Number,
              ),
            sizeBytes: sql<number>`coalesce(sum(${mediaItem.sizeBytes}), 0)`.mapWith(Number),
          })
          .from(mediaItem)
          .where(isStillThere())
          .groupBy(mediaItem.libraryId),
        db
          .select({
            libraryId: book.libraryId,
            itemCount: sql<number>`count(${bookChapter.id})`.mapWith(Number),
            sizeBytes: sql<number>`coalesce(sum(${bookChapter.sizeBytes}), 0)`.mapWith(Number),
          })
          .from(bookChapter)
          .innerJoin(book, eq(bookChapter.bookId, book.id))
          .where(isNull(bookChapter.missingSince))
          .groupBy(book.libraryId),
      ]);
      const titlesIn = new Map(titles.map((total) => [total.libraryId, total]));
      const chaptersIn = new Map(chapters.map((total) => [total.libraryId, total]));
      const totalOf = (id: string, kind: string) =>
        (kind === 'books' ? chaptersIn : titlesIn).get(id) ?? { itemCount: 0, sizeBytes: 0 };

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: LibraryKindSchema.parse(row.kind),
        flavour: row.flavour,
        path: row.path,
        itemCount: totalOf(row.id, row.kind).itemCount,
        sizeBytes: totalOf(row.id, row.kind).sizeBytes,
        lastScannedAt: toIso(row.lastScannedAt),
        ...readLastScan(row),
        defaultAudioLanguage: row.defaultAudioLanguage,
        filesAtOnce: row.filesAtOnce,
        takesRequests: row.takesRequests,
        requestProfileId: row.requestProfileId,
        requestPath: row.requestPath,
        keepsShowsTogether: row.keepsShowsTogether,
        metadataLanguage: row.metadataLanguage,
        usesOriginalTitle: row.usesOriginalTitle,
        writesNfo: row.writesNfo,
        higherProfileAsks: row.higherProfileAsks,
        fulfilment: row.requestFulfilment,
        linkedServerId: row.linkedServerId,
      })) satisfies Library[];
    },

    create: async (input) => {
      const details = await stat(input.path).catch(() => null);

      if (details === null || !details.isDirectory()) {
        return null;
      }

      const created = {
        id: randomUUID(),
        name: input.name,
        kind: input.kind,
        flavour: input.flavour ?? null,
        path: input.path,
      };

      await db.insert(library).values(created);

      return {
        ...created,
        itemCount: 0,
        lastScannedAt: null,
        defaultAudioLanguage: null,
        filesAtOnce: null,
        takesRequests: true,
        requestProfileId: null,
        requestPath: null,
        keepsShowsTogether: true,
        metadataLanguage: null,
        usesOriginalTitle: false,
        writesNfo: false,
        higherProfileAsks: 'ask',
        fulfilment: null,
      };
    },

    update: async (libraryId, input) => {
      const before = await findLibrary(libraryId);

      if (before === null) {
        return null;
      }

      const isEpisodic = before.kind === 'shows' || before.kind === 'anime';

      await db
        .update(library)
        .set({
          ...(input.kind === undefined || !isEpisodic
            ? {}
            : {
                kind: input.kind,
                flavour: null,
                ...(input.kind === 'anime' ? { requestFulfilment: null } : {}),
              }),
          defaultAudioLanguage: input.defaultAudioLanguage,
          ...(input.filesAtOnce === undefined ? {} : { filesAtOnce: input.filesAtOnce }),
          ...(input.takesRequests === undefined ? {} : { takesRequests: input.takesRequests }),
          ...(input.requestProfileId === undefined
            ? {}
            : { requestProfileId: input.requestProfileId }),
          ...(input.requestPath === undefined ? {} : { requestPath: input.requestPath }),
          ...(input.keepsShowsTogether === undefined
            ? {}
            : { keepsShowsTogether: input.keepsShowsTogether }),
          ...(input.higherProfileAsks === undefined
            ? {}
            : { higherProfileAsks: input.higherProfileAsks }),
          ...(input.metadataLanguage === undefined
            ? {}
            : { metadataLanguage: input.metadataLanguage }),
          ...(input.usesOriginalTitle === undefined
            ? {}
            : { usesOriginalTitle: input.usesOriginalTitle }),
          ...(input.writesNfo === undefined ? {} : { writesNfo: input.writesNfo }),
          ...(input.fulfilment === undefined ? {} : { requestFulfilment: input.fulfilment }),
        })
        .where(eq(library.id, libraryId));

      if (before.defaultAudioLanguage !== input.defaultAudioLanguage) {
        await clearJobCompletions(db, libraryId, REGENERATE_PREVIEWS_JOB);
      }

      const [row] = await db
        .select({
          ...LIBRARY_COLUMNS,
          itemCount:
            sql<number>`case when ${library.kind} = 'books' then count(distinct ${bookChapter.id}) else count(distinct case when ${mediaItem.parentId} is null then ${mediaItem.id} end) end`.mapWith(
              Number,
            ),
        })
        .from(library)
        .leftJoin(mediaItem, and(eq(mediaItem.libraryId, library.id), isStillThere()))
        .leftJoin(book, eq(book.libraryId, library.id))
        .leftJoin(
          bookChapter,
          and(eq(bookChapter.bookId, book.id), isNull(bookChapter.missingSince)),
        )
        .where(eq(library.id, libraryId))
        .groupBy(...Object.values(LIBRARY_COLUMNS));

      if (row === undefined) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        kind: LibraryKindSchema.parse(row.kind),
        flavour: row.flavour,
        path: row.path,
        itemCount: row.itemCount,
        lastScannedAt: toIso(row.lastScannedAt),
        defaultAudioLanguage: row.defaultAudioLanguage,
        filesAtOnce: row.filesAtOnce,
        takesRequests: row.takesRequests,
        requestProfileId: row.requestProfileId,
        requestPath: row.requestPath,
        keepsShowsTogether: row.keepsShowsTogether,
        metadataLanguage: row.metadataLanguage,
        usesOriginalTitle: row.usesOriginalTitle,
        writesNfo: row.writesNfo,
        higherProfileAsks: row.higherProfileAsks,
        fulfilment: row.requestFulfilment,
        linkedServerId: row.linkedServerId,
      };
    },

    listFacets: async (viewer) => {
      const genre = jsonTextElements(mediaItem.genres, 'genre');
      const genreRows = await db
        .select({ value: genre.value })
        .from(sql`${mediaItem}, ${genre.rows}`)
        .where(
          and(
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        )
        .groupBy(genre.value)
        .orderBy(asc(genre.value));

      const decade = sql<number>`${floorDivided(mediaItem.year, sql`10`)} * 10`.mapWith(Number);
      const decadeRows = await db
        .select({ value: decade })
        .from(mediaItem)
        .where(
          and(
            isNotNull(mediaItem.year),
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        )
        .groupBy(decade)
        .orderBy(desc(decade));

      const [best] = await db
        .select({ rating: sql<number>`coalesce(max(${mediaItem.rating}), 0)`.mapWith(Number) })
        .from(mediaItem)
        .where(
          and(
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        );

      const track = jsonObjectElements(mediaItem.audioStreams, 'track', {
        language: 'text',
        codec: 'text',
        channels: 'integer',
        isAtmos: 'boolean',
      });
      const trackRows = await db
        .select({
          language: sql<string | null>`${track.field('language')}`,
          codec: sql<string | null>`${track.field('codec')}`,
          channels: sql<number | null>`${track.field('channels')}`.mapWith(Number),
          isAtmos: truth(sql`${track.field('isAtmos')}`),
        })
        .from(sql`${mediaItem}, ${track.rows}`)
        .where(
          and(
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        )
        .groupBy(
          track.field('language'),
          track.field('codec'),
          track.field('channels'),
          track.field('isAtmos'),
        );

      return {
        genres: genreRows.map((row) => row.value),
        decades: decadeRows.map((row) => row.value),
        maxRating: best?.rating ?? 0,
        ...audioFacetsOf(trackRows),
      };
    },

    listItems: async (viewer, libraryId, options) => {
      const asksForStreamed = options.ids !== undefined && (await isStreamedLibrary(libraryId));

      if (!asksForStreamed && !(await libraryVisible(viewer, libraryId))) {
        return null;
      }

      const holds = await kindOfLibrary(libraryId);
      const tracksWanted = audioTracksWanted(
        options.audio ?? { languages: [], codecs: [], channels: [] },
      );

      const asked = [
        eq(mediaItem.libraryId, libraryId),
        isNotATrack(db),
        visibleToViewer(db, viewer, { includesStreamed: asksForStreamed }),
        ...(options.search === undefined || options.search.trim() === ''
          ? []
          : [matchesSearch(options.search)]),
        ...(options.kind === undefined
          ? []
          : options.kind === 'shows'
            ? [isNotNull(mediaItem.seriesTitle)]
            : holds === 'shows'
              ? [sql`false`]
              : [isNull(mediaItem.seriesTitle)]),
        ...(options.genre === undefined || options.genre === ''
          ? []
          : [jsonContains(mediaItem.genres, [options.genre])]),
        ...(options.genres === undefined || options.genres.length === 0
          ? []
          : [or(...options.genres.map((one) => jsonContains(mediaItem.genres, [one])))]),
        ...(options.decades === undefined || options.decades.length === 0
          ? []
          : [
              or(
                ...options.decades.map((decade) =>
                  and(gte(mediaItem.year, decade), lte(mediaItem.year, decade + DECADE - 1)),
                ),
              ),
            ]),
        ...(tracksWanted.length === 0
          ? []
          : [or(...tracksWanted.map((one) => jsonContains(mediaItem.audioStreams, [one])))]),
        ...(options.yearFrom === undefined ? [] : [gte(mediaItem.year, options.yearFrom)]),
        ...(options.yearTo === undefined ? [] : [lte(mediaItem.year, options.yearTo)]),
        ...(options.minRating === undefined ? [] : [gte(mediaItem.rating, options.minRating)]),
        ...(options.seriesId === undefined ? [] : [eq(mediaItem.seriesId, options.seriesId)]),
        ...(options.ids === undefined
          ? [
              isNull(mediaItem.extraKind),
              ...(options.withVersions === true ? [] : [isNull(mediaItem.parentId)]),
            ]
          : options.ids.length === 0
            ? [sql`false`]
            : [inArray(mediaItem.id, options.ids)]),
        ...(options.minYourStars === undefined || options.profileId === undefined
          ? []
          : [gte(yourStars(options.profileId), options.minYourStars)]),
      ];

      const filters = and(...asked);

      const [totals] = await db.select({ total: count() }).from(mediaItem).where(filters);

      const rows = await db
        .select({
          ...SUMMARY_COLUMNS,
          sizeBytes: mediaItem.sizeBytes,
          parentId: mediaItem.parentId,
          versionLabel: mediaItem.versionLabel,
        })
        .from(mediaItem)
        .where(filters)
        .orderBy(...orderingFor(options))
        .limit(options.limit)
        .offset(options.offset);

      const items = rows.map(summaryOfRow) satisfies MediaSummary[];

      return { items, total: totals?.total ?? 0 };
    },

    correctMatch: async (mediaId, reference, by) => {
      const paths = await pathsOfTheSameThing(mediaId);

      if (paths === null) {
        return null;
      }

      for (const path of paths.paths) {
        await store.saveOverride({
          libraryId: paths.libraryId,
          path,
          externalId: reference.externalId,
          externalKind: reference.externalKind,
          updatedBy: by,
        });
      }

      const jobId = await queueReadAgain(paths.libraryId, paths.paths);

      return { corrected: paths.paths.length, jobId };
    },

    listLeftOut: async (libraryId) =>
      (await findLibrary(libraryId)) === null ? null : store.listLeftOut(libraryId),

    leaveOut: async (libraryId, asked, by) => {
      const found = await findLibrary(libraryId);

      if (found === null) {
        return { kind: 'noLibrary' };
      }

      const path = asked.path.replace(/[\\/]+$/u, '');

      if (path === found.path || !isUnderAny(path, [found.path])) {
        return { kind: 'outside' };
      }

      const isFolder = await stat(path).then(
        (held) => held.isDirectory(),
        () => false,
      );
      const leftOut = await store.leaveOut({
        libraryId,
        path,
        isFolder,
        note: asked.note,
        createdBy: by,
      });

      if (leftOut === null) {
        return { kind: 'noLibrary' };
      }

      const queued = await askForLibraryWork(jobs, SCAN_LIBRARY_JOB, libraryId, {
        libraryId,
        force: false,
      });

      return { kind: 'left', leftOut, jobId: queued?.jobId ?? null };
    },

    bringBack: async (libraryId, leftOutId) => {
      const leftOut = await store.bringBack(libraryId, leftOutId);

      if (leftOut === null) {
        return null;
      }

      const queued = await askForLibraryWork(jobs, SCAN_LIBRARY_JOB, libraryId, {
        libraryId,
        force: false,
      });

      return { leftOut, jobId: queued?.jobId ?? null };
    },

    unmatch: async (mediaId, by) => {
      const paths = await pathsOfTheSameThing(mediaId);

      if (paths === null) {
        return null;
      }

      for (const path of paths.paths) {
        await store.saveOverride({
          libraryId: paths.libraryId,
          path,
          externalId: '',
          externalKind: 'none',
          updatedBy: by,
        });
      }

      const jobId = await queueReadAgain(paths.libraryId, paths.paths);

      return { corrected: paths.paths.length, jobId };
    },

    refreshTitle: async (mediaId, mode) => {
      const paths = await pathsOfTheSameThing(mediaId);

      if (paths === null) {
        return null;
      }

      if (mode === 'files') {
        await db
          .update(mediaItem)
          .set({ probeVersion: null })
          .where(
            and(eq(mediaItem.libraryId, paths.libraryId), inArray(mediaItem.path, paths.paths)),
          );

        return {
          corrected: paths.paths.length,
          jobId: await queueReadAgain(paths.libraryId, paths.paths, true),
        };
      }

      if (mode === 'details') {
        const [held] = await db
          .select({ externalId: mediaItem.externalId, seriesTitle: mediaItem.seriesTitle })
          .from(mediaItem)
          .where(eq(mediaItem.id, mediaId))
          .limit(1);

        if (held?.externalId !== null && held?.externalId !== undefined) {
          const { externalId } = held;

          shapes.forgetWhere((key) => key === externalId || key.startsWith(`${externalId}?`));

          const borrowed = (await seasonSourcesOfFile(db, mediaId))?.sources ?? [];

          for (const provider of providers ?? []) {
            provider.forgetAnswersAbout?.(externalId, held.seriesTitle === null ? 'movie' : 'tv');

            for (const one of borrowed) {
              provider.forgetAnswersAbout?.(one.externalId, 'tv');
            }
          }
        }

        return {
          corrected: paths.paths.length,
          jobId: await queueReadAgain(paths.libraryId, paths.paths, true),
        };
      }

      const files = await db
        .select({
          id: mediaItem.id,
          posterUrl: mediaItem.posterUrl,
          backdropUrl: mediaItem.backdropUrl,
          logoUrl: mediaItem.logoUrl,
        })
        .from(mediaItem)
        .where(and(eq(mediaItem.libraryId, paths.libraryId), inArray(mediaItem.path, paths.paths)));
      const addresses = new Set(
        files.flatMap((file) =>
          [file.posterUrl, file.backdropUrl, file.logoUrl].filter((url) => url !== null),
        ),
      );
      const forgetting = images ?? { forget: () => Promise.resolve() };

      for (const address of addresses) {
        await forgetting.forget(address);
      }

      const ids = files.map((file) => file.id);

      if (ids.length > 0) {
        await db
          .update(mediaItem)
          .set({ artworkChangedAt: new Date() })
          .where(inArray(mediaItem.id, ids));
        onArtworkChanged?.(ids);
      }

      return { corrected: ids.length, jobId: null };
    },

    forgetCorrection: async (mediaId) => {
      const paths = await pathsOfTheSameThing(mediaId);

      if (paths === null) {
        return null;
      }

      await store.removeOverrides(paths.libraryId, paths.paths);

      const jobId = await queueReadAgain(paths.libraryId, paths.paths);

      return { corrected: paths.paths.length, jobId };
    },

    rebuildArtefacts: async (mediaId) => {
      const subject = await previewSubjectOf(mediaId);

      if (subject === null) {
        return null;
      }

      return rebuildItemArtefacts({
        quality: await previewQuality(),
        item: subject,
        trickplay: {
          intervalSeconds: TRICKPLAY_INTERVAL_SECONDS,
          tileWidth: TRICKPLAY_TILE_WIDTH,
          columns: TRICKPLAY_COLUMNS,
          rows: TRICKPLAY_ROWS,
        },
        transcoder,
        ...(onProblem === undefined ? {} : { onProblem }),
      });
    },

    setPreviewMoment: async (mediaId, moment, by) => {
      const subject = await previewSubjectOf(mediaId);

      if (subject === null) {
        return { kind: 'absent' };
      }

      if (moment.atSeconds >= subject.durationSeconds) {
        return { kind: 'beyondTheEnd', durationSeconds: subject.durationSeconds };
      }

      await store.savePreviewMoment({
        libraryId: subject.libraryId,
        path: subject.path,
        atSeconds: moment.atSeconds,
        durationSeconds: moment.durationSeconds,
        updatedBy: by,
      });
      await recutPreview(subject, subject.previewMoment, moment);

      return { kind: 'set', moment };
    },

    clearPreviewMoment: async (mediaId) => {
      const subject = await previewSubjectOf(mediaId);

      if (subject === null) {
        return null;
      }

      const cleared = await store.removePreviewMoment(subject.libraryId, subject.path);

      if (cleared) {
        await recutPreview(subject, subject.previewMoment, null);
      }

      return { cleared };
    },

    getSeries: async (seriesId) => {
      const rows = await db
        .select({ id: series.id, title: series.title })
        .from(series)
        .where(and(eq(series.id, seriesId), hasSomethingStillThere(db)))
        .limit(1);

      return rows[0] ?? null;
    },

    seriesOf: async (mediaId) => {
      const rows = await db
        .select({ seriesId: mediaItem.seriesId })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      return rows[0]?.seriesId ?? null;
    },

    itemsForShare: async (scope) => {
      const where =
        scope.kind === 'item'
          ? scope.mediaId === null
            ? null
            : eq(mediaItem.id, scope.mediaId)
          : scope.seriesId === null
            ? null
            : and(
                eq(mediaItem.seriesId, scope.seriesId),
                isNull(mediaItem.extraKind),
                isNull(mediaItem.parentId),
              );

      if (where === null) {
        return [];
      }

      const rows = await db
        .select(SUMMARY_COLUMNS)
        .from(mediaItem)
        .where(and(where, isStillThere()))
        .orderBy(asc(mediaItem.seasonNumber), asc(mediaItem.episodeNumber), asc(mediaItem.title))
        .limit(MOST_EPISODES_SHARED);

      return rows.map(summaryOfRow) satisfies MediaSummary[];
    },

    findPeople: async (viewer, search, limit) => {
      const like = `%${likeLiterally(search.trim())}%`;
      const member = jsonObjectElements(mediaItem.castMembers, 'member', {
        personId: 'integer',
        name: 'text',
        imageUrl: 'text',
      });
      const titles = sql<number>`count(distinct coalesce(${mediaItem.seriesId}, ${mediaItem.id}))`;
      const name = sql<string>`max(${member.field('name')})`;

      const rows = await db
        .select({
          personId: sql<number>`${member.field('personId')}`.mapWith(Number),
          name,
          imageUrl: sql<string | null>`max(${member.field('imageUrl')})`,
          titleCount: titles.mapWith(Number),
        })
        .from(sql`${mediaItem}, ${member.rows}`)
        .where(
          and(
            isNotNull(member.field('personId')),
            containsInsensitively(member.field('name'), like),
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        )
        .groupBy(member.field('personId'))
        .orderBy(desc(titles), asc(name))
        .limit(limit);

      return rows.filter((row) => row.personId > 0);
    },

    findByPerson: async (viewer, personId) => {
      const rows = await db
        .select(SUMMARY_COLUMNS)
        .from(mediaItem)
        .where(
          and(
            jsonContains(mediaItem.castMembers, [{ personId }]),
            isNull(mediaItem.extraKind),
            isNull(mediaItem.parentId),
            visibleToViewer(db, viewer),
          ),
        )
        .orderBy(asc(mediaItem.title))
        .limit(CREDITS_LIMIT);

      return rows.map(summaryOfRow) satisfies MediaSummary[];
    },

    readPerson: async (personId) => {
      const asking = (providers ?? []).find((provider) => provider.readPerson !== undefined);

      return (await asking?.readPerson?.(personId)) ?? null;
    },

    isOutOfReach: async (asThem, mediaId) => {
      const rows = await db
        .select({ reachable: truth(sql`coalesce(${reachableByViewer(db, asThem)}, true)`) })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      return rows.length > 0 && rows[0]?.reachable === false;
    },

    isSeriesOutOfReach: async (asThem, seriesId) => {
      const rows = await db
        .select({ reachable: truth(sql`coalesce(${reachableByViewer(db, asThem)}, true)`) })
        .from(mediaItem)
        .where(eq(mediaItem.seriesId, seriesId));

      return rows.length > 0 && rows.every((row) => row.reachable === false);
    },

    refusedLibraries: async (accountId) => {
      const rows = await db
        .select({ libraryId: libraryBlock.libraryId })
        .from(libraryBlock)
        .where(eq(libraryBlock.userId, accountId));

      return rows.map((row) => row.libraryId);
    },

    allowLibrary: async (accountId, libraryId) => {
      await db
        .delete(libraryBlock)
        .where(and(eq(libraryBlock.userId, accountId), eq(libraryBlock.libraryId, libraryId)));
    },

    refuseLibrary: async (accountId, libraryId) => {
      await insertUnlessPresent(db, libraryBlock, {
        values: [{ userId: accountId, libraryId, blockedAt: new Date() }],
        target: [libraryBlock.userId, libraryBlock.libraryId],
      });
    },

    ceilingsFor: async (accountId) => {
      const rows = await db
        .select({
          libraryId: ageCeiling.libraryId,
          maximumAge: ageCeiling.maximumAge,
          allowsUnrated: ageCeiling.allowsUnrated,
        })
        .from(ageCeiling)
        .where(eq(ageCeiling.userId, accountId));

      return rows;
    },

    setCeiling: async (accountId, ceiling) => {
      await upsert(db, ageCeiling, {
        values: [
          {
            userId: accountId,
            libraryId: ceiling.libraryId,
            maximumAge: ceiling.maximumAge,
            allowsUnrated: ceiling.allowsUnrated,
            setAt: new Date(),
          },
        ],
        target: [ageCeiling.userId, ageCeiling.libraryId],
        set: { maximumAge: ceiling.maximumAge, allowsUnrated: ceiling.allowsUnrated },
      });
    },

    clearCeiling: async (accountId, libraryId) => {
      await db
        .delete(ageCeiling)
        .where(and(eq(ageCeiling.userId, accountId), eq(ageCeiling.libraryId, libraryId)));
    },

    exceptionsFor: async (accountId) => {
      const rows = await db
        .select({
          mediaItemId: ageException.mediaItemId,
          seriesId: ageException.seriesId,
          effect: ageException.effect,
          itemTitle: mediaItem.title,
          seriesTitle: series.title,
        })
        .from(ageException)
        .leftJoin(mediaItem, eq(mediaItem.id, ageException.mediaItemId))
        .leftJoin(series, eq(series.id, ageException.seriesId))
        .where(eq(ageException.userId, accountId))
        .orderBy(desc(ageException.grantedAt));

      return rows.flatMap((row): AgeExceptionEntry[] => {
        const effect = row.effect === 'deny' ? ('deny' as const) : ('allow' as const);

        if (row.mediaItemId !== null && row.itemTitle !== null) {
          return [
            { kind: 'item' as const, subjectId: row.mediaItemId, title: row.itemTitle, effect },
          ];
        }

        if (row.seriesId !== null && row.seriesTitle !== null) {
          return [
            { kind: 'series' as const, subjectId: row.seriesId, title: row.seriesTitle, effect },
          ];
        }

        return [];
      });
    },

    setException: async (accountId, subject, effect, grantedBy) => {
      const exists =
        subject.kind === 'item'
          ? (
              await db
                .select({ id: mediaItem.id })
                .from(mediaItem)
                .where(eq(mediaItem.id, subject.subjectId))
                .limit(1)
            ).length > 0
          : (
              await db
                .select({ id: series.id })
                .from(series)
                .where(eq(series.id, subject.subjectId))
                .limit(1)
            ).length > 0;

      if (!exists) {
        return false;
      }

      await upsert(db, ageException, {
        values: [
          {
            id: randomUUID(),
            userId: accountId,
            mediaItemId: subject.kind === 'item' ? subject.subjectId : null,
            seriesId: subject.kind === 'series' ? subject.subjectId : null,
            effect,
            grantedBy,
            grantedAt: new Date(),
          },
        ],
        target:
          subject.kind === 'item'
            ? [ageException.userId, ageException.mediaItemId]
            : [ageException.userId, ageException.seriesId],
        set: { effect, grantedBy, grantedAt: new Date() },
        targetWhere:
          subject.kind === 'item'
            ? isNotNull(ageException.mediaItemId)
            : isNotNull(ageException.seriesId),
      });

      return true;
    },

    exceptionsOn: async (subject) => {
      const rows = await db
        .select({ userId: ageException.userId, effect: ageException.effect })
        .from(ageException)
        .where(
          subject.kind === 'item'
            ? eq(ageException.mediaItemId, subject.subjectId)
            : eq(ageException.seriesId, subject.subjectId),
        );

      return rows.map((row) => ({
        accountId: row.userId,
        effect: row.effect === 'deny' ? ('deny' as const) : ('allow' as const),
      }));
    },

    clearException: async (accountId, subject) => {
      const gone = await db
        .delete(ageException)
        .where(
          and(
            eq(ageException.userId, accountId),
            subject.kind === 'item'
              ? eq(ageException.mediaItemId, subject.subjectId)
              : eq(ageException.seriesId, subject.subjectId),
          ),
        );

      return countAffected(gone) > 0;
    },

    isLibraryOutOfReach: async (accountId, libraryId) => {
      const refused = await db
        .select({ one: sql<number>`1` })
        .from(libraryBlock)
        .where(and(eq(libraryBlock.userId, accountId), eq(libraryBlock.libraryId, libraryId)))
        .limit(1);

      return refused.length > 0;
    },

    getMedia: async (id) => {
      const rows = await db
        .select()
        .from(mediaItem)
        .where(and(eq(mediaItem.id, id), isNotATrack(db), isStillThere()))
        .limit(1);
      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      const held = await db
        .select({
          id: mediaItem.id,
          libraryId: mediaItem.libraryId,
          title: mediaItem.title,
          year: mediaItem.year,
          durationSeconds: mediaItem.durationSeconds,
          width: mediaItem.width,
          height: mediaItem.height,
          videoCodec: mediaItem.videoCodec,
          videoRange: mediaItem.videoRange,
          addedAt: mediaItem.addedAt,
          posterUrl: mediaItem.posterUrl,
          artworkChangedAt: mediaItem.artworkChangedAt,
          extraKind: mediaItem.extraKind,
          versionLabel: mediaItem.versionLabel,
          parentId: mediaItem.parentId,
          sizeBytes: mediaItem.sizeBytes,
        })
        .from(mediaItem)
        .where(and(eq(mediaItem.parentId, id), isStillThere()))
        .orderBy(asc(mediaItem.extraKind), asc(mediaItem.title));

      const region = (await certificationRegion()).trim().toUpperCase();
      const own =
        row.path.startsWith(LINKED_SCHEME) && row.seriesId === null && row.externalId !== null
          ? await ownDescriptionOf(row.externalId)
          : null;
      const ownCertification = own?.certifications?.[region] ?? null;
      const detail: MediaDetail = MediaDetailSchema.parse({
        id: row.id,
        ...artworkRevisionOf(row.artworkChangedAt),
        libraryId: row.libraryId,
        parentId: row.parentId,
        extraKind: row.extraKind,
        versionLabel: row.versionLabel,
        trailerKey: row.trailerKey,
        previewMoment: await store.readPreviewMoment(row.libraryId, row.path),
        extras: held
          .filter((one) => one.extraKind !== null)
          .map(({ posterUrl, artworkChangedAt, ...extra }) => ({
            ...extra,
            ...artworkRevisionOf(artworkChangedAt),
            addedAt: extra.addedAt.toISOString(),
            hasPoster: posterUrl !== null,
            posterUrl,
            hasBackdrop: false,
            hasLogo: false,
          })),
        versions: held
          .filter((one) => one.extraKind === null)
          .map(({ posterUrl, artworkChangedAt, ...version }) => ({
            ...version,
            ...artworkRevisionOf(artworkChangedAt),
            addedAt: version.addedAt.toISOString(),
            hasPoster: posterUrl !== null,
            posterUrl,
            hasBackdrop: false,
            hasLogo: false,
          })),
        title: row.title,
        year: row.year,
        container: row.container,
        durationSeconds: row.durationSeconds,
        videoCodec: row.videoCodec,
        videoCodecTag: row.videoCodecTag,
        videoRange: row.videoRange,
        videoRangeBase: row.videoRangeBase,
        videoBitDepth: row.videoBitDepth ?? 8,
        videoLevel: row.videoLevel,
        videoFrameRate: row.videoFrameRate,
        videoIsInterlaced: row.videoIsInterlaced ?? false,
        videoRefFrames: row.videoRefFrames,
        videoPixelAspect: row.videoPixelAspect,
        videoRotationDegrees: row.videoRotationDegrees,
        canCopySegments: row.canCopySegments ?? true,
        width: row.width,
        height: row.height,
        bitrateKbps: row.bitrateKbps ?? 1,
        sizeBytes: row.sizeBytes,
        audioStreams: row.audioStreams,
        subtitleStreams: row.subtitleStreams,
        addedAt: row.addedAt.toISOString(),
        metadata: {
          overview: own?.overview ?? row.overview,
          tagline: own?.tagline ?? row.tagline,
          genres: own === null || own.genres.length === 0 ? row.genres : own.genres,
          cast:
            own === null || own.cast.length === 0
              ? row.castMembers
              : own.cast.map((member) => ({
                  personId: member.personId,
                  name: member.name,
                  role: member.role ?? '',
                  imageUrl: member.photoUrl,
                })),
          rating: own?.rating ?? row.rating,
          hasPoster: row.posterUrl !== null,
          posterUrl: row.posterUrl,
          externalId: row.externalId,
          hasBackdrop: row.backdropUrl !== null,
          hasLogo: row.logoUrl !== null,
          seriesTitle: row.seriesTitle,
          seasonNumber: row.seasonNumber,
          episodeNumber: row.episodeNumber,
          episodeNumberEnd: row.episodeNumberEnd,
          releaseDate: own?.releaseDate ?? row.releaseDate,
          budget: row.budget,
          revenue: row.revenue,
          status: own?.status ?? row.catalogueStatus,
          rottenTomatoes: row.rottenTomatoes,
          certification:
            ownCertification ??
            readStoredCertifications(JsonValueSchema.parse(row.certifications ?? null))?.[region] ??
            null,
          certificationRegion: region,
          advisories: adviceFor(JsonValueSchema.parse(row.contentAdvice ?? null), region),
        },
      });

      return detail;
    },

    readBarePosterUrl: (mediaId) => artworkChoices.barePosterFor(mediaId),

    readArtworkChoices: (mediaId) => artworkChoices.read(mediaId),
    readArtworkPart: (mediaId, part) => artworkChoices.readPart(mediaId, part),
    chooseArtworkPart: (mediaId, part, url, by) =>
      artworkChoices.choosePart(mediaId, part, url, by),

    chooseArtwork: (mediaId, kind, url, by) => artworkChoices.choose(mediaId, kind, url, by),
    uploadArtwork: (mediaId, kind, artwork, by) =>
      artworkChoices.upload(mediaId, kind, artwork, by),
    chooseVersion: (mediaId, choice) => versionChoices.choose(mediaId, choice),
    planPatternRenames: (mediaIds) => patternRenames.plan(mediaIds),
    renameToPattern: (mediaIds, whenTaken) => patternRenames.apply(mediaIds, whenTaken),

    chooseExtra: async (mediaId, choice) => {
      const [file] = await db
        .select({ libraryId: mediaItem.libraryId, path: mediaItem.path })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);
      const [parent] =
        choice.parentId === null
          ? []
          : await db
              .select({ path: mediaItem.path, libraryId: mediaItem.libraryId })
              .from(mediaItem)
              .where(eq(mediaItem.id, choice.parentId))
              .limit(1);

      if (
        file === undefined ||
        (choice.extraKind !== null && (parent === undefined || parent.libraryId !== file.libraryId))
      ) {
        return null;
      }

      const where = and(eq(extraChoice.libraryId, file.libraryId), eq(extraChoice.path, file.path));

      await db.transaction(async (tx) => {
        await tx.delete(extraChoice).where(where);

        if (choice.isForgotten === true) {
          return;
        }

        await tx.insert(extraChoice).values({
          libraryId: file.libraryId,
          path: file.path,
          extraKind: choice.extraKind,
          parentPath: choice.extraKind === null ? null : (parent?.path ?? null),
        });
      });

      if (choice.extraKind === null) {
        await db
          .update(mediaItem)
          .set({ extraKind: null, parentId: null })
          .where(eq(mediaItem.id, mediaId));
      }

      return { corrected: 1, jobId: await queueReadAgain(file.libraryId, [file.path], true) };
    },

    readWordRules: async (libraryId) =>
      (
        await db
          .select({ find: wordRule.find, replace: wordRule.replace })
          .from(wordRule)
          .where(and(eq(wordRule.libraryId, libraryId), eq(wordRule.field, 'genres')))
          .orderBy(asc(wordRule.setAt))
      ).map((rule) => ({ field: 'genres' as const, ...rule })),

    saveWordRules: async (libraryId, rules) => {
      await db.transaction(async (tx) => {
        await tx.delete(wordRule).where(eq(wordRule.libraryId, libraryId));

        if (rules.length > 0) {
          await tx
            .insert(wordRule)
            .values(rules.map((rule) => ({ id: randomUUID(), libraryId, ...rule })));
        }
      });

      return [...rules];
    },

    pinEpisode: async (mediaId, pin) => {
      const [file] = await db
        .select({
          libraryId: mediaItem.libraryId,
          path: mediaItem.path,
          seriesId: mediaItem.seriesId,
        })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (file === undefined || file.seriesId === null) {
        return null;
      }

      const where = and(eq(episodePin.libraryId, file.libraryId), eq(episodePin.path, file.path));

      await db.transaction(async (tx) => {
        await tx.delete(episodePin).where(where);

        if (pin !== null) {
          await tx
            .insert(episodePin)
            .values({ libraryId: file.libraryId, path: file.path, ...pin });
        }
      });

      return { corrected: 1, jobId: await queueReadAgain(file.libraryId, [file.path], true) };
    },

    readSeasonSource: async (mediaId) => {
      const held = await seasonSourcesOfFile(db, mediaId);

      if (held === null || held.seasonNumber === null) {
        return { source: null, canChoose: false };
      }

      const found = held.sources.find((one) => one.seasonNumber === held.seasonNumber);

      return {
        canChoose: true,
        source:
          found === undefined
            ? null
            : {
                externalId: found.externalId,
                externalSeason: found.externalSeason,
                title: found.title,
                year: found.year,
              },
      };
    },

    chooseSeasonSource: async (mediaId, source) => {
      const held = await seasonSourcesOfFile(db, mediaId);
      const seasonNumber = held?.seasonNumber ?? null;

      if (held === null || seasonNumber === null) {
        return null;
      }

      const { libraryId, seriesId } = held;
      const season = and(
        eq(seasonSource.seriesId, seriesId),
        eq(seasonSource.seasonNumber, seasonNumber),
      );

      if (source === null) {
        await db.delete(seasonSource).where(season);
      } else {
        const [shape, described] = await Promise.all([
          resolveSeriesShape(providers ?? [], source.externalId),
          firstAnswerOf(providers ?? [], (provider) =>
            provider.describeTitle?.(source.externalId, 'tv'),
          ),
        ]);

        if (shape === null) {
          return 'catalogueUnavailable';
        }

        if (
          described === null ||
          !shape.seasons.some((one) => one.seasonNumber === source.externalSeason)
        ) {
          return 'noSuchSeason';
        }

        const chosen = {
          externalId: source.externalId,
          externalSeason: source.externalSeason,
          title: described.title,
          year: described.year,
          setAt: new Date(),
        };

        await upsert(db, seasonSource, {
          values: [{ seriesId, seasonNumber, ...chosen }],
          target: [seasonSource.seriesId, seasonSource.seasonNumber],
          set: chosen,
        });
      }

      const files = await db
        .select({ path: mediaItem.path })
        .from(mediaItem)
        .where(and(eq(mediaItem.seriesId, seriesId), eq(mediaItem.seasonNumber, seasonNumber)))
        .orderBy(asc(mediaItem.path));
      const paths = files.map((one) => one.path);

      return { corrected: paths.length, jobId: await queueReadAgain(libraryId, paths, true) };
    },

    readCatalogueSeasons: async (externalId) => {
      const shape = await resolveSeriesShape(providers ?? [], externalId);

      return shape === null
        ? null
        : {
            seasons: shape.seasons.map((one) => ({
              seasonNumber: one.seasonNumber,
              name: one.name ?? null,
              episodeCount: one.episodeCount,
              airDate: one.airDate ?? null,
            })),
          };
    },

    chooseEpisodeOrder: async (mediaId, order) => {
      const [file] = await db
        .select({ seriesId: mediaItem.seriesId })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);
      const paths = await pathsOfTheSameThing(mediaId);

      if (file?.seriesId === null || file?.seriesId === undefined || paths === null) {
        return null;
      }

      await db
        .update(series)
        .set({ episodeOrder: order, updatedAt: new Date() })
        .where(eq(series.id, file.seriesId));

      return {
        corrected: paths.paths.length,
        jobId: await queueReadAgain(paths.libraryId, paths.paths, true),
      };
    },

    readEpisodeOrders: async (mediaId) => {
      const [file] = await db
        .select({ episodeOrder: series.episodeOrder, externalId: series.externalId })
        .from(mediaItem)
        .innerJoin(series, eq(series.id, mediaItem.seriesId))
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (file === undefined) {
        return null;
      }

      const { externalId } = file;
      const groups =
        externalId === null
          ? []
          : ((await firstAnswerOf(
              providers ?? [],
              async (provider) => {
                const found = await provider.readEpisodeGroups?.(externalId);

                return found === undefined || found.length === 0 ? null : found;
              },
              () => {},
            )) ?? []);

      return {
        orders: groups.map((group) => ({ id: group.id, name: group.name, type: group.type })),
        chosen: file.episodeOrder,
      };
    },
    isOwnArtwork: (mediaId, url) => artworkChoices.isOwnPicture(mediaId, url),

    readArtworkUrl: async (mediaId, kind, isOfTitle = false) => {
      const chosen = await artworkChoices.urlFor(mediaId, kind, isOfTitle);

      if (chosen !== null) {
        return chosen;
      }

      const rows = await db
        .select({
          poster: mediaItem.posterUrl,
          backdrop: mediaItem.backdropUrl,
          logo: mediaItem.logoUrl,
        })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      return (kind === 'poster' ? row.poster : kind === 'logo' ? row.logo : row.backdrop) ?? null;
    },

    scan: async (libraryId, force = false, run) => {
      if ((await findLibrary(libraryId)) === null) {
        return null;
      }

      const asking = {
        libraryId,
        force,
        ...(run === undefined ? {} : { runId: run.id, runOf: run.of }),
      };

      if (force) {
        return jobBehindTheKey(
          await jobs.enqueue(SCAN_LIBRARY_JOB, asking, libraryId),
          SCAN_LIBRARY_JOB,
          libraryId,
          jobs,
        );
      }

      return askForLibraryWork(jobs, SCAN_LIBRARY_JOB, libraryId, asking);
    },

    reset: async (libraryId) => {
      if ((await findLibrary(libraryId)) === null) {
        return null;
      }

      await jobs.cancelFor(libraryId);
      await store.clear(libraryId);

      await db
        .update(library)
        .set({ generation: sql`${library.generation} + 1` })
        .where(eq(library.id, libraryId));

      const jobId = await jobs.enqueue(SCAN_LIBRARY_JOB, { libraryId, force: true }, libraryId);

      return jobBehindTheKey(jobId, SCAN_LIBRARY_JOB, libraryId, jobs);
    },

    remove: async (libraryId) => {
      if ((await findLibrary(libraryId)) === null) {
        return false;
      }

      await jobs.cancelFor(libraryId);

      const keptCopies = await keptCopiesOf(db, eq(mediaItem.libraryId, libraryId));

      await db.delete(library).where(eq(library.id, libraryId));
      await forgetKeptCopies(keptCopies);
      await jobs.enqueue(CLEANUP_ARTEFACT_CACHE_JOB, {}, CLEANUP_ARTEFACT_CACHE_JOB);

      return true;
    },

    deleteMedia: async (mediaId) => {
      const deleted = await deleteFilesWhere(eq(mediaItem.id, mediaId));

      return deleted.kind === 'deleted' ? { kind: 'deleted' } : deleted;
    },

    deleteSeries: (seriesId) => deleteFilesWhere(eq(mediaItem.seriesId, seriesId)),

    moveMedia: async (mediaIds, toLibraryId) => {
      const target = await findLibrary(toLibraryId);

      if (target === null || (target.kind !== 'movies' && target.kind !== 'shows')) {
        return { kind: 'wrongKind' };
      }

      const items =
        mediaIds.length === 0
          ? []
          : await db
              .select({ id: mediaItem.id, path: mediaItem.path, libraryId: mediaItem.libraryId })
              .from(mediaItem)
              .where(inArray(mediaItem.id, [...mediaIds]));
      const sourceId = items[0]?.libraryId ?? null;
      const source = sourceId === null ? null : await findLibrary(sourceId);

      if (source === null || items.some((item) => item.libraryId !== source.id)) {
        return { kind: 'absent' };
      }

      if (source.id === target.id) {
        return { kind: 'sameLibrary' };
      }

      if (source.kind !== 'movies' && source.kind !== 'shows') {
        return { kind: 'wrongKind' };
      }

      const moved: string[] = [];

      for (const item of items) {
        const parts = await db
          .select({ position: mediaPart.position, path: mediaPart.path })
          .from(mediaPart)
          .where(eq(mediaPart.mediaItemId, item.id))
          .orderBy(asc(mediaPart.position));
        const outcome = await moveMediaFile(
          source.path,
          item.path,
          target.path,
          parts.slice(1).map((part) => part.path),
        );

        if (outcome.kind !== 'moved') {
          await store.forgetEmptySeries?.(source.id);

          return moved.length === 0
            ? outcome
            : { ...outcome, jobId: await queueReadAgain(target.id, moved) };
        }

        await db
          .update(mediaItem)
          .set({
            libraryId: target.id,
            path: outcome.to,
            seriesId: null,
            seriesTitle: null,
            seasonNumber: null,
            episodeNumber: null,
            episodeNumberEnd: null,
            parentId: null,
            externalId: null,
          })
          .where(eq(mediaItem.id, item.id));

        for (const [at, path] of [outcome.to, ...outcome.laterTo].entries()) {
          const part = parts[at];

          if (part !== undefined) {
            await db
              .update(mediaPart)
              .set({ path })
              .where(
                and(eq(mediaPart.mediaItemId, item.id), eq(mediaPart.position, part.position)),
              );
          }
        }

        await db
          .update(mediaPreviewOverride)
          .set({ libraryId: target.id, path: outcome.to })
          .where(
            and(
              eq(mediaPreviewOverride.libraryId, source.id),
              eq(mediaPreviewOverride.path, item.path),
            ),
          );
        await db
          .delete(mediaOverride)
          .where(and(eq(mediaOverride.libraryId, source.id), eq(mediaOverride.path, item.path)));

        moved.push(outcome.to);
      }

      await store.forgetEmptySeries?.(source.id);

      return { kind: 'moved', files: moved.length, jobId: await queueReadAgain(target.id, moved) };
    },

    mediaIdsAt: async (paths) => {
      if (paths.length === 0) {
        return {};
      }

      const [rows, parts] = await Promise.all([
        db
          .select({ id: mediaItem.id, path: mediaItem.path })
          .from(mediaItem)
          .where(inArray(mediaItem.path, paths)),
        db
          .select({ id: mediaPart.mediaItemId, path: mediaPart.path })
          .from(mediaPart)
          .where(inArray(mediaPart.path, paths)),
      ]);

      return Object.fromEntries([...parts, ...rows].map((row) => [row.path, row.id]));
    },

    readEntryFacts: async (libraryId, files, folders) => {
      const HELD = {
        id: mediaItem.id,
        parentId: mediaItem.parentId,
        seriesId: mediaItem.seriesId,
        title: mediaItem.title,
        seriesTitle: mediaItem.seriesTitle,
        externalId: mediaItem.externalId,
        extraKind: mediaItem.extraKind,
      };
      const filmsUnder = async () => {
        const found: { id: string; title: string; path: string }[] = [];

        for (let at = 0; at < folders.length; at += FOLDERS_ASKED_AT_ONCE) {
          const asked = folders.slice(at, at + FOLDERS_ASKED_AT_ONCE);

          found.push(
            ...(await db
              .select({ id: mediaItem.id, title: mediaItem.title, path: mediaItem.path })
              .from(mediaItem)
              .where(
                and(
                  eq(mediaItem.libraryId, libraryId),
                  isNull(mediaItem.seriesTitle),
                  isNull(mediaItem.extraKind),
                  isNull(mediaItem.parentId),
                  or(...asked.map((folder) => like(mediaItem.path, `${likeLiterally(folder)}/%`))),
                ),
              )),
          );
        }

        return Object.fromEntries(
          folders.flatMap((folder) => {
            const held = found.filter((one) => one.path.startsWith(`${folder}/`));
            const [only] = held;

            return only === undefined || held.some((one) => one.id !== only.id)
              ? []
              : [[folder, { rootId: only.id, title: only.title }]];
          }),
        );
      };
      const [items, parts, shows, leftOut, issues, films] = await Promise.all([
        files.length === 0
          ? []
          : db
              .select({ ...HELD, path: mediaItem.path })
              .from(mediaItem)
              .where(and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, [...files]))),
        files.length === 0
          ? []
          : db
              .select({ ...HELD, path: mediaPart.path })
              .from(mediaPart)
              .innerJoin(mediaItem, eq(mediaItem.id, mediaPart.mediaItemId))
              .where(and(eq(mediaItem.libraryId, libraryId), inArray(mediaPart.path, [...files]))),
        folders.length === 0
          ? []
          : db
              .select({ id: series.id, key: series.key, title: series.title })
              .from(series)
              .where(
                and(
                  eq(series.libraryId, libraryId),
                  inArray(
                    series.key,
                    folders.map((folder) => `folder:${folder}`),
                  ),
                ),
              ),
        store.listLeftOut(libraryId),
        files.length === 0
          ? []
          : db
              .select({
                path: jobRunIssue.path,
                reason: jobRunIssue.reason,
                atMs: jobRunIssue.atMs,
              })
              .from(jobRunIssue)
              .where(inArray(jobRunIssue.path, [...files]))
              .orderBy(asc(jobRunIssue.atMs)),
        folders.length === 0 ? {} : filmsUnder(),
      ]);

      return {
        media: Object.fromEntries(
          [...parts, ...items].map((row) => [
            row.path,
            {
              id: row.id,
              rootId: row.parentId ?? row.id,
              seriesId: row.seriesId,
              title: row.title,
              seriesTitle: row.seriesTitle,
              isMatched: row.externalId !== null && row.externalId !== '',
              isExtra: row.extraKind !== null,
            },
          ]),
        ),
        shows: Object.fromEntries(
          shows.flatMap((one) => {
            const folder = folderOfSeriesKey(one.key);

            return folder === null ? [] : [[folder, { seriesId: one.id, title: one.title }]];
          }),
        ),
        films,
        leftOut: leftOut.map((one) => ({ path: one.path, isFolder: one.isFolder })),
        issues: Object.fromEntries(
          issues.flatMap((one) => {
            const said = SaidSchema.safeParse(one.reason);

            return said.success ? [[one.path, said.data]] : [];
          }),
        ),
      };
    },

    mediaPathsIn: async (libraryId) => {
      const [items, albums, books] = await Promise.all([
        db
          .select({ id: mediaItem.id, path: mediaItem.path })
          .from(mediaItem)
          .where(and(eq(mediaItem.libraryId, libraryId), isNotATrack(db))),
        db
          .select({ id: musicTrack.albumId, path: sql<string>`min(${mediaItem.path})` })
          .from(musicTrack)
          .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
          .where(eq(mediaItem.libraryId, libraryId))
          .groupBy(musicTrack.albumId),
        db.select({ id: book.id, path: book.path }).from(book).where(eq(book.libraryId, libraryId)),
      ]);

      return Object.fromEntries([...items, ...albums, ...books].map((row) => [row.id, row.path]));
    },

    regeneratePreviews: async (libraryId) => {
      const found = await findLibrary(libraryId);

      if (found === null) {
        return null;
      }

      return askForLibraryWork(jobs, REGENERATE_PREVIEWS_JOB, libraryId, {
        libraryId,
        defaultAudioLanguage: found.defaultAudioLanguage,
      });
    },

    fetchLogos: async (libraryId) => {
      if ((await findLibrary(libraryId)) === null) {
        return null;
      }

      return askForLibraryWork(jobs, FETCH_LOGOS_JOB, libraryId, { libraryId });
    },

    remakePreviews: async (libraryId) => {
      await clearJobCompletions(db, libraryId, REGENERATE_PREVIEWS_JOB);

      return service.regeneratePreviews(libraryId);
    },

    clearParts: async (libraryId, parts) => {
      const found = await findLibrary(libraryId);

      if (found === null) {
        return null;
      }

      const offered = LIBRARY_PARTS_BY_KIND[LibraryKindSchema.parse(found.kind)];
      const clearing = parts.filter((part) => offered.includes(part));

      if (clearing.length === 0) {
        return null;
      }

      const jobId = await jobs.enqueue(
        CLEAR_LIBRARY_PARTS_JOB,
        { libraryId, parts: clearing },
        libraryId,
      );

      return jobBehindTheKey(jobId, CLEAR_LIBRARY_PARTS_JOB, libraryId, jobs);
    },

    runClearParts: async (libraryId, parts, jobId) => {
      const isFinished = await clearLibraryParts({
        libraryId,
        parts,
        store: createClearableLibrary(db),
        images: images ?? { forget: () => Promise.resolve() },
        files: { remove: (path) => rm(path, { force: true }) },
        transcoder,
        quality: await previewQuality(),
        trickplay: {
          intervalSeconds: TRICKPLAY_INTERVAL_SECONDS,
          tileWidth: TRICKPLAY_TILE_WIDTH,
          columns: TRICKPLAY_COLUMNS,
          rows: TRICKPLAY_ROWS,
        },
        ...(onProblem === undefined ? {} : { onProblem }),
        ...(jobId === undefined
          ? {}
          : {
              onProgress: (done, total) =>
                jobs.reportProgress(jobId, saying('server.jobs.phase.clearing'), done, total),
              isCancelled: () => jobs.isCancelled(jobId),
            }),
      });

      if (!isFinished) {
        return;
      }

      const readsAgain = readsAgainAfterClearing(parts);

      if (readsAgain) {
        shapes.clear();

        for (const provider of providers ?? []) {
          provider.forgetAnswers?.();
        }
      }

      await jobs.enqueue(SCAN_LIBRARY_JOB, { libraryId, force: readsAgain }, libraryId);
    },

    regenerateTrickplay: async (libraryId) => {
      if ((await findLibrary(libraryId)) === null) {
        return null;
      }

      return askForLibraryWork(jobs, REGENERATE_TRICKPLAY_JOB, libraryId, { libraryId });
    },

    detectSegments: async (libraryId) => {
      if ((await findLibrary(libraryId)) === null) {
        return null;
      }

      return askForLibraryWork(jobs, DETECT_SEGMENTS_JOB, libraryId, { libraryId });
    },

    readScanState: async (jobId) => {
      const state = await jobs.readState(jobId);
      const progress = jobs.readProgress(jobId);

      return {
        state,
        phase: progress?.phase ?? null,
        processed: progress?.processed ?? null,
        total: progress?.total ?? null,
        item: progress?.item ?? null,
      };
    },

    runReadAgain: async (libraryId, paths, jobId, keepsMatches = false) => {
      const readFiles = () =>
        db
          .select({
            id: mediaItem.id,
            externalId: mediaItem.externalId,
            seriesId: mediaItem.seriesId,
            seriesTitle: mediaItem.seriesTitle,
          })
          .from(mediaItem)
          .where(
            and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, paths), isStillThere()),
          );
      const before = new Map((await readFiles()).map((file) => [file.id, file.externalId]));

      await readAgain(
        libraryId,
        paths,
        jobId === undefined
          ? undefined
          : (phase, processed, total) =>
              jobs.reportProgress(jobId, saying(`server.jobs.phase.${phase}`), processed, total),
        keepsMatches,
      );

      const after = await readFiles();

      if (after.length === 0) {
        return { mediaIds: [], heldAs: new Map() };
      }

      await relogo(after.filter((file) => before.get(file.id) !== file.externalId));
      await db
        .update(mediaItem)
        .set({ artworkChangedAt: new Date() })
        .where(
          inArray(
            mediaItem.id,
            after.map((file) => file.id),
          ),
        );

      const seriesIds = [
        ...new Set(after.flatMap((file) => (file.seriesId === null ? [] : [file.seriesId]))),
      ];
      const shows =
        seriesIds.length === 0
          ? []
          : await db
              .select({ id: series.id, externalId: series.externalId })
              .from(series)
              .where(inArray(series.id, seriesIds));

      return {
        mediaIds: after.map((file) => file.id),
        heldAs: new Map([
          ...after.flatMap((file) =>
            file.seriesId === null ? [[file.id, file.externalId] as const] : [],
          ),
          ...shows.map((show) => [show.id, show.externalId] as const),
        ]),
      };
    },

    runScanFolder: async (libraryId, folder, jobId) => {
      const found = await findLibrary(libraryId);

      if (found?.kind === 'books') {
        return scanBooks(found, false, jobId);
      }

      if (
        found === null ||
        (found.kind !== 'movies' && found.kind !== 'shows' && found.kind !== 'anime')
      ) {
        return found?.kind === 'music'
          ? scanMusic({ id: libraryId, path: folder }, false, jobId, true)
          : null;
      }

      return scanLibrary({
        libraryId,
        metadataLanguage: found.metadataLanguage ?? null,
        usesOriginalTitle: found.usesOriginalTitle,
        kind: found.kind === 'movies' ? 'movies' : found.kind === 'anime' ? 'anime' : 'shows',
        root: found.path,
        within: folder,
        files: filesFor(libraryId),
        store,
        transcoder,
        isPartial: true,
        atOnce: await filesAtOnceFor(libraryId),
        ...(providers === undefined ? {} : { providers }),
        ...(onProblem === undefined ? {} : { onProblem }),
        ...(onArrived === undefined ? {} : { onAdded: (item) => onArrived(libraryId, item) }),
        ...(jobId === undefined
          ? {}
          : {
              onProgress: (phase, processed, total) =>
                jobs.reportProgress(jobId, saying(`server.jobs.phase.${phase}`), processed, total),
            }),
      });
    },

    findByCatalogueId: async (libraryId, kind, externalId) => {
      if (kind === 'series') {
        const [found] = await db
          .select({ id: series.id })
          .from(series)
          .where(
            and(
              eq(series.libraryId, libraryId),
              eq(series.externalId, externalId),
              hasSomethingStillThere(db),
            ),
          )
          .limit(1);

        return found?.id ?? null;
      }

      const [found] = await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(
          and(
            eq(mediaItem.libraryId, libraryId),
            eq(mediaItem.externalId, externalId),
            isStillThere(),
            isNull(mediaItem.seriesId),
            isNull(mediaItem.parentId),
          ),
        )
        .limit(1);

      return found?.id ?? null;
    },

    runScan: async (libraryId, force = false, jobId) => {
      const found = await findLibrary(libraryId);

      if (found === null) {
        return null;
      }

      const result = await (found.kind === 'books'
        ? scanBooks(found, force, jobId)
        : found.kind === 'music'
          ? scanMusic(found, force, jobId)
          : scanFilms(found, force, jobId));

      await db
        .update(library)
        .set({
          lastScanAdded: result.added,
          lastScanUpdated: result.updated,
          lastScanRemoved: result.removed,
          lastScanFailed: result.failed,
        })
        .where(eq(library.id, libraryId));

      return result;
    },

    runRegeneratePreviews: async (libraryId, defaultAudioLanguage, jobId) => {
      const chosenAccel = await forcedAccel?.();

      await regeneratePreviews({
        ...(jobId === undefined ? {} : { correlationId: jobId }),
        libraryId,
        generation: (await findLibrary(libraryId))?.generation ?? 0,
        atOnce: await filesAtOnceFor(libraryId),
        store: {
          listOutstanding: (id) => listOutstandingFor(db, id, REGENERATE_PREVIEWS_JOB),
          markComplete: (mediaItemId) => markJobComplete(db, mediaItemId, REGENERATE_PREVIEWS_JOB),
        },
        transcoder,
        defaultAudioLanguage,
        quality: await previewQuality(),
        ...(chosenAccel === undefined ? {} : { hardwareAccel: chosenAccel }),
        ...(onProblem === undefined ? {} : { onProblem }),
        ...(jobId === undefined
          ? {}
          : {
              onProgress: (processed, total) =>
                jobs.reportProgress(jobId, saying('server.jobs.phase.previews'), processed, total),
              isCancelled: () => jobs.isCancelled(jobId),
            }),
      });
    },

    runFetchLogos: async (libraryId, jobId) => {
      const readLogoUrl = (providers ?? []).find(
        (provider) => provider.readLogoUrl !== undefined,
      )?.readLogoUrl;

      await fetchLogos({
        libraryId,
        store: {
          listMissing: async (id) => {
            const rows = await db
              .select({
                id: mediaItem.id,
                externalId: mediaItem.externalId,
                seriesTitle: mediaItem.seriesTitle,
              })
              .from(mediaItem)
              .where(and(eq(mediaItem.libraryId, id), isNull(mediaItem.logoUrl)));

            return rows.flatMap((row) =>
              row.externalId === null
                ? []
                : [
                    {
                      id: row.id,
                      externalId: row.externalId,
                      isSeries: row.seriesTitle !== null,
                    },
                  ],
            );
          },
          save: async (mediaItemIds, logoUrl) => {
            await db.update(mediaItem).set({ logoUrl }).where(inArray(mediaItem.id, mediaItemIds));
          },
        },
        ...(readLogoUrl === undefined ? {} : { readLogoUrl }),
        ...(onProblem === undefined ? {} : { onProblem }),
        ...(jobId === undefined
          ? {}
          : {
              onProgress: (done, total) =>
                jobs.reportProgress(jobId, saying('server.jobs.phase.logos'), done, total),
              isCancelled: () => jobs.isCancelled(jobId),
            }),
      });
    },

    runRegenerateTrickplay: async (libraryId, jobId) => {
      const chosenAccel = await forcedAccel?.();

      await generateTrickplay({
        libraryId,
        generation: (await findLibrary(libraryId))?.generation ?? 0,
        ...(jobId === undefined ? {} : { correlationId: jobId }),
        atOnce: await filesAtOnceFor(libraryId),
        store: {
          listOutstanding: (id) => listOutstandingFor(db, id, REGENERATE_TRICKPLAY_JOB),
          markComplete: (mediaItemId) => markJobComplete(db, mediaItemId, REGENERATE_TRICKPLAY_JOB),
        },
        transcoder,
        ...(chosenAccel === undefined ? {} : { hardwareAccel: chosenAccel }),
        keyframesOnly: await usesKeyframeThumbnails(),
        trickplay: {
          intervalSeconds: TRICKPLAY_INTERVAL_SECONDS,
          tileWidth: TRICKPLAY_TILE_WIDTH,
          columns: TRICKPLAY_COLUMNS,
          rows: TRICKPLAY_ROWS,
        },
        ...(onProblem === undefined ? {} : { onProblem }),
        ...(jobId === undefined
          ? {}
          : {
              onProgress: (processed, total) =>
                jobs.reportProgress(jobId, saying('server.jobs.phase.trickplay'), processed, total),
              isCancelled: () => jobs.isCancelled(jobId),
            }),
      });
    },

    listShows: async (viewer, libraryId) => {
      const episodes = await readEveryEpisode({
        pageSize: EPISODES_AT_A_TIME,
        readPage: (limit, offset) =>
          service.listItems(viewer, libraryId, { kind: 'shows', limit, offset }),
      });

      return episodes === null ? null : groupIntoShows(episodes, await finishedBy(viewer));
    },

    comingUp: async (viewer) => {
      const today = new Date().toISOString().slice(0, 10);

      const shows = await showsInTheCatalogue(viewer);
      const borrowed = await borrowedSeasonsOf(
        shows.flatMap(({ show }) => (show.seriesId === null ? [] : [show.seriesId])),
      );
      const nextOf = (externalId: string) =>
        nextEpisodes.keep(externalId, () =>
          resolveNextEpisode(providers ?? [], externalId, (provider, reason) => {
            onProblem?.(provider, reason);
          }),
        );
      const upcoming = await Promise.all(
        shows.map(async ({ show, externalId }) => {
          const fromElsewhere = await Promise.all(
            (show.seriesId === null ? [] : (borrowed.get(show.seriesId) ?? [])).map(async (one) => {
              const next = await nextOf(one.externalId);

              return next === null || next.seasonNumber !== one.externalSeason
                ? []
                : [{ ...next, seasonNumber: one.seasonNumber }];
            }),
          );
          const own = await nextOf(externalId);
          const isBorrowed = (seasonNumber: number) =>
            show.seriesId !== null &&
            (borrowed.get(show.seriesId) ?? []).some((one) => one.seasonNumber === seasonNumber);
          const [soonest] = [
            ...(own === null || isBorrowed(own.seasonNumber) ? [] : [own]),
            ...fromElsewhere.flat(),
          ]
            .flatMap((next) => (next.airDate < today ? [] : [next]))
            .toSorted((left, right) => left.airDate.localeCompare(right.airDate));

          return soonest === undefined ? [] : [{ show, episode: soonest }];
        }),
      );

      return upcoming
        .flat()
        .sort(
          (left, right) =>
            left.episode.airDate.localeCompare(right.episode.airDate) ||
            left.show.title.localeCompare(right.show.title),
        )
        .slice(0, COMING_UP_SHOWN);
    },

    upNext: async (viewer) => {
      if (viewer.kind !== 'account' || viewer.profileId === null) {
        return [];
      }

      const rows = await db
        .select({
          mediaId: watchProgress.mediaItemId,
          positionSeconds: watchProgress.positionSeconds,
          durationSeconds: watchProgress.durationSeconds,
          isFinished: watchProgress.isFinished,
          updatedAt: watchProgress.updatedAt,
          seriesId: mediaItem.seriesId,
          seasonNumber: mediaItem.seasonNumber,
          libraryId: mediaItem.libraryId,
        })
        .from(watchProgress)
        .innerJoin(mediaItem, eq(mediaItem.id, watchProgress.mediaItemId))
        .where(
          and(
            eq(watchProgress.profileId, viewer.profileId),
            isNotNull(mediaItem.seriesId),
            isStillThere(),
            gte(watchProgress.updatedAt, new Date(Date.now() - UP_NEXT_LOOKS_BACK_MS)),
          ),
        )
        .orderBy(desc(watchProgress.updatedAt));

      const latestBySeries = new Map<string, (typeof rows)[number]>();
      const finishedBySeries = new Map<string, (typeof rows)[number]>();

      for (const row of rows) {
        if (row.seriesId === null) {
          continue;
        }

        if (!latestBySeries.has(row.seriesId)) {
          latestBySeries.set(row.seriesId, row);
        }

        if (row.isFinished && row.seasonNumber !== 0 && !finishedBySeries.has(row.seriesId)) {
          finishedBySeries.set(row.seriesId, row);
        }
      }

      const leftOff = [...finishedBySeries.entries()].filter(([seriesId]) => {
        const latest = latestBySeries.get(seriesId);

        return (
          latest === undefined ||
          !isWorthResuming({ ...latest, updatedAt: latest.updatedAt.toISOString() })
        );
      });
      const stillGoing = await seriesWithEpisodesLeft(
        viewer.profileId,
        leftOff.map(([seriesId]) => seriesId),
      );
      const carryingOn = leftOff.filter(([seriesId]) => stillGoing.has(seriesId));

      const finished = new Set(rows.filter((row) => row.isFinished).map((row) => row.mediaId));
      const lastWatched = new Map(rows.map((row) => [row.mediaId, row.updatedAt]));
      const dismissed = new Map(
        (
          await db
            .select({
              mediaId: continueWatchingDismissal.mediaItemId,
              dismissedAt: continueWatchingDismissal.dismissedAt,
            })
            .from(continueWatchingDismissal)
            .where(eq(continueWatchingDismissal.profileId, viewer.profileId))
        ).map((one) => [one.mediaId, one.dismissedAt]),
      );

      const resolve = async ([seriesId, last]: (typeof carryingOn)[number]) => {
        const episodes = await readEveryEpisode({
          pageSize: EPISODES_AT_A_TIME,
          readPage: (limit, offset) =>
            service.listItems(viewer, last.libraryId, {
              kind: 'shows',
              seriesId,
              limit,
              offset,
            }),
        });
        const watched = episodes?.find((episode) => episode.id === last.mediaId);

        if (episodes === null || watched === undefined) {
          return [];
        }

        let next = nextEpisode(episodes, watched);

        while (next !== null && finished.has(next.id)) {
          next = nextEpisode(episodes, next);
        }

        const dismissedAt = next === null ? undefined : dismissed.get(next.id);
        const ownAt = next === null ? undefined : lastWatched.get(next.id);
        const watchedAt = ownAt !== undefined && ownAt > last.updatedAt ? ownAt : last.updatedAt;

        return next === null || (dismissedAt !== undefined && dismissedAt >= watchedAt)
          ? []
          : [{ episode: next, lastWatchedAt: last.updatedAt.toISOString() }];
      };

      const shown: UpNext['episodes'] = [];

      for (
        let from = 0;
        from < carryingOn.length && shown.length < UP_NEXT_SHOWN;
        from += UP_NEXT_SHOWN
      ) {
        const found = await Promise.all(carryingOn.slice(from, from + UP_NEXT_SHOWN).map(resolve));

        shown.push(...found.flat());
      }

      return shown.slice(0, UP_NEXT_SHOWN);
    },

    releaseCalendar: async (viewer, from, to) => {
      const shows = await showsInTheCatalogue(viewer);
      const borrowed = await borrowedSeasonsOf(
        shows.flatMap(({ show }) => (show.seriesId === null ? [] : [show.seriesId])),
      );
      const airing = await Promise.all(
        shows.map(async ({ show, externalId }) => {
          const asked = [
            { from: externalId, season: null, as: null },
            ...(show.seriesId === null ? [] : (borrowed.get(show.seriesId) ?? [])).map((one) => ({
              from: one.externalId,
              season: one.externalSeason,
              as: one.seasonNumber,
            })),
          ];
          const seasons = await Promise.all(
            asked.map(async (one) => ({ ...one, airing: await airingSeasonOf(one.from) })),
          );

          return seasons.flatMap(({ season, as, airing: found }) =>
            found === null ||
            (season === null
              ? asked.some((one) => one.as === found.seasonNumber)
              : found.seasonNumber !== season)
              ? []
              : found.episodes
                  .filter((episode) => episode.airDate >= from && episode.airDate <= to)
                  .map((episode) => ({
                    show,
                    externalId,
                    seasonNumber: as ?? found.seasonNumber,
                    episode,
                  })),
          );
        }),
      );

      const due = airing.flat();
      const held = await episodesHeldOf(
        due.flatMap(({ show }) => (show.seriesId === null ? [] : [show.seriesId])),
      );

      return due.map(({ show, externalId, seasonNumber, episode }) => ({
        show,
        externalId,
        seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        airDate: episode.airDate,
        stillUrl: episode.stillUrl ?? null,
        isHeld:
          show.seriesId !== null &&
          held.has(heldKey(show.seriesId, seasonNumber, episode.episodeNumber)),
      }));
    },

    airingStills: async (catalogueIds) => {
      const seasons = await Promise.all(
        [...new Set(catalogueIds)].map(async (catalogueId) => ({
          catalogueId,
          season: await airingSeasonOf(catalogueId),
        })),
      );

      return new Map(
        seasons.flatMap(({ catalogueId, season }) =>
          season === null
            ? []
            : season.episodes.flatMap((episode) =>
                episode.stillUrl === null
                  ? []
                  : [
                      [
                        episodeEntryId(catalogueId, season.seasonNumber, episode.episodeNumber),
                        episode.stillUrl,
                      ] as const,
                    ],
              ),
        ),
      );
    },

    catalogueArtwork: async (titles) => {
      const wanted = new Map(titles.map((title) => [catalogueTitleKey(title), title]));
      const found = await Promise.all(
        [...wanted].map(async ([key, title]) => [key, await catalogueArtworkOf(title)] as const),
      );

      return new Map(found);
    },

    getShow: async (viewer, libraryId, showId) => {
      const readShow = (narrowed: boolean) =>
        readEveryEpisode({
          pageSize: EPISODES_AT_A_TIME,
          readPage: (limit, offset) =>
            service.listItems(viewer, libraryId, {
              kind: 'shows',
              limit,
              offset,
              ...(narrowed ? { seriesId: showId } : {}),
            }),
        });

      const ofTheSeries = await readShow(true);
      const episodes =
        ofTheSeries !== null && ofTheSeries.length > 0 ? ofTheSeries : await readShow(false);
      const detail =
        episodes === null ? null : buildShowDetail(episodes, showId, await finishedBy(viewer));

      if (detail === null) {
        return null;
      }

      const shape = await shapeOf(detail);
      const extras = await extrasOfShow(viewer, libraryId, detail);

      const [cover] = await db
        .select({
          trailerKey: mediaItem.trailerKey,
          externalId: mediaItem.externalId,
          certifications: mediaItem.certifications,
          contentAdvice: mediaItem.contentAdvice,
        })
        .from(mediaItem)
        .where(eq(mediaItem.id, detail.coverMediaId))
        .limit(1);
      const externalId = cover?.externalId ?? '';
      const region = (await certificationRegion()).trim().toUpperCase();
      const [placed] =
        detail.seriesId === null
          ? []
          : await db
              .select({ key: series.key })
              .from(series)
              .where(eq(series.id, detail.seriesId))
              .limit(1);
      const showKey =
        externalId !== ''
          ? `tv:${externalId}`
          : placed === undefined
            ? null
            : `series:${placed.key}`;
      const laid =
        showKey === null
          ? shape
          : overlayShowEdits(
              shape,
              showKey,
              await titleEdits.editsFor(libraryId, [
                showKey,
                ...(shape?.seasons ?? []).map(
                  (season) => `${showKey}:s${season.seasonNumber.toString()}`,
                ),
              ]),
            );

      const whole = {
        ...detail,
        extras,
        certification:
          readStoredCertifications(JsonValueSchema.parse(cover?.certifications ?? null))?.[
            region
          ] ?? null,
        certificationRegion: region,
        advisories: adviceFor(JsonValueSchema.parse(cover?.contentAdvice ?? null), region),
        trailerKey: cover?.trailerKey ?? null,
        tmdbId: /^\d+$/.test(externalId) ? Number(externalId) : null,
      };

      if (laid === null) {
        return whole;
      }

      const pictured =
        externalId === ''
          ? new Map<string, string>()
          : await artworkChoices.partsChosen(libraryId, externalId);
      const seasons = laid.seasons.map((season) => ({
        ...season,
        posterUrl:
          pictured.get(artworkChoices.kindOfPart({ season: season.seasonNumber, episode: null })) ??
          season.posterUrl ??
          null,
        episodes: season.episodes.map((episode) => ({
          ...episode,
          stillUrl:
            pictured.get(
              artworkChoices.kindOfPart({
                season: season.seasonNumber,
                episode: episode.episodeNumber,
              }),
            ) ?? episode.stillUrl,
        })),
      }));

      return shape === null
        ? { ...whole, status: laid.status ?? null, overview: laid.overview ?? null }
        : {
            ...whole,
            shape: seasons,
            status: laid.status ?? null,
            overview: laid.overview ?? null,
            nextEpisode: nextEpisodeOf(seasons, new Date().toISOString().slice(0, 10)),
          };
    },
  };

  return service;
};

export { createDatabaseLibraryService };
