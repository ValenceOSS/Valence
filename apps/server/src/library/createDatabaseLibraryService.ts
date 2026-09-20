import { askForLibraryWork } from '@ValenceServer/library/askForLibraryWork';
import { jobBehindTheKey } from '@ValenceServer/library/jobBehindTheKey';
import { randomUUID } from 'node:crypto';
import { rm, stat } from 'node:fs/promises';
import { z } from 'zod';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import {
  ageCeiling,
  ageException,
  book,
  bookChapter,
  library,
  libraryBlock,
  mediaItem,
  mediaPreviewOverride,
  rating,
  series,
} from '@ValenceServer/db/Schema';
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
import { scanBookLibrary } from '@ValenceServer/books/scanBookLibrary';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';
import type { BookStore } from '@ValenceServer/books/scanBookLibrary';
import { scanMusicLibrary } from '@ValenceServer/music/scanMusicLibrary';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import type {
  MusicArtwork,
  MusicFileSystem,
  MusicStore,
} from '@ValenceServer/music/scanMusicLibrary';
import { groupIntoShows, buildShowDetail } from './groupIntoShows';
import { createExpiringCache } from './createExpiringCache';
import { resolveSeriesShape } from './MetadataProvider';
import { regeneratePreviews } from './regeneratePreviews';
import { generateTrickplay } from './generateTrickplay';
import { rebuildItemArtefacts } from './rebuildItemArtefacts';
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
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type {
  Library,
  MediaDetail,
  MediaSummary,
  PreviewMoment,
  ScanResult,
} from '@ValenceContracts/schemas/Library';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { MediaFileSystem, ScanPhase, ScannedItem } from './scanLibrary';
import type { MetadataProvider, SeriesShape } from './MetadataProvider';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { reachableByViewer } from '@ValenceServer/visibility/reachableByViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { AgeExceptionEntry, LibraryService, ListItemsOptions } from './LibraryService';
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
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { filesAtOnce } from '@ValenceServer/library/filesAtOnce';

const GenresSchema = z.array(z.string());

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
  db: ValenceDatabase;
  files: MediaFileSystem;
  transcoder: Transcoder;
  forcedAccel?: () => Promise<string>;
  jobs: JobQueue;
  previewQuality?: () => Promise<PreviewQuality>;
  certificationRegion?: () => Promise<string>;
  providers?: MetadataProvider[];
  books?: BookStore;
  images?: { forget: (url: string) => Promise<void> };
  music?: {
    store: MusicStore;
    artwork: MusicArtwork;
    files: Omit<MusicFileSystem, 'listFiles'>;
  };
  onProblem?: (path: string, reason: string) => void;
  onArrived?: (libraryId: string, item: ScannedItem) => void;
  onDeparted?: (libraryId: string, items: ScannedItem[]) => void;
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

  return or(
    ilike(mediaItem.title, like),
    ilike(mediaItem.seriesTitle, like),
    ilike(mediaItem.overview, like),
    ilike(mediaItem.tagline, like),
    sql`exists (
      select 1
      from jsonb_array_elements(coalesce(${mediaItem.castMembers}, '[]'::jsonb)) as member
      where member->>'name' ilike ${like}
    )`,
  );
};

/**
 * Reads the genres off a stored row, through a schema rather than trusting the column: whatever a
 * catalogue wrote there years ago is not something to hand a browser unchecked, and a row that no
 * longer parses is an item with no genres rather than a failed page.
 *
 * @param stored - The column as the database returned it.
 * @returns The genres, or null where the column held something else.
 */
const readGenres = (stored: JsonValue): string[] | null => {
  const parsed = GenresSchema.safeParse(stored);

  return parsed.success ? parsed.data : null;
};

type DatabaseLibraryService = LibraryService & {
  runScan: (libraryId: string, force?: boolean, jobId?: string) => Promise<ScanResult | null>;
  runReadAgain: (libraryId: string, paths: string[], jobId?: string) => Promise<void>;
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

const EVERY_EPISODE = 2000;

const CREDITS_LIMIT = 200;

const SERIES_SHAPE_LIVES_FOR_MS = 6 * 60 * 60 * 1000;

/**
 * What one profile gave an item, as a subquery rather than a join, so that filtering or sorting by a
 * rating never changes how many rows a page comes back with. A profile that has not rated something
 * reads as nothing, which sorts last rather than as a zero nobody gave it.
 *
 * @param profileId - Whose rating to read.
 * @returns The rating, as a value the query can compare and order by.
 */
const yourStars = (profileId: string) =>
  sql<
    number | null
  >`(select ${rating.stars} from ${rating} where ${rating.mediaItemId} = ${mediaItem.id} and ${rating.profileId} = ${profileId} limit 1)`;

/**
 * Decides how a page of items is ordered. Ordering by a viewer's own rating puts the highest first
 * and anything unrated last, then falls back to the title so that everything they gave the same
 * number of stars still comes back in a stable order rather than whatever the database felt like.
 *
 * @param options - What the caller asked for, including whose ratings to order by.
 * @returns The ordering, as the clauses to apply in turn.
 */
const orderingFor = (options: ListItemsOptions) => {
  if (options.order === 'yourRating' && options.profileId !== undefined) {
    return [sql`${yourStars(options.profileId)} desc nulls last`, asc(mediaItem.title)];
  }

  return [options.order === 'newest' ? desc(mediaItem.addedAt) : asc(mediaItem.title)];
};

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
  images,
  music,
  atOnce = 1,
  previewQuality = (): Promise<PreviewQuality> => Promise.resolve('high'),
  certificationRegion = (): Promise<string> => Promise.resolve('GB'),
  onProblem,
  onArrived,
  onDeparted,
}: CreateDatabaseLibraryServiceOptions): DatabaseLibraryService => {
  const store = createMediaStore(db, certificationRegion);

  const shapes = createExpiringCache<SeriesShape | null>(SERIES_SHAPE_LIVES_FOR_MS);

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
   * @param detail - The show being drawn.
   * @returns Its shape, or null where nothing identifies the programme.
   */
  const shapeOf = async (detail: ShowDetail): Promise<SeriesShape | null> => {
    const [row] = await db
      .select({ externalId: mediaItem.externalId })
      .from(mediaItem)
      .where(eq(mediaItem.id, detail.coverMediaId))
      .limit(1);

    const externalId = row?.externalId ?? null;

    if (externalId === null || externalId === '') {
      return null;
    }

    const known = shapes.get(externalId);

    if (known !== undefined) {
      return known;
    }

    const found = await resolveSeriesShape(providers ?? [], externalId, (provider, reason) => {
      onProblem?.(provider, reason);
    });

    shapes.set(externalId, found);

    return found;
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
      rows.map(({ posterUrl, backdropUrl, ...extra }) => ({
        ...extra,
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
      onProblem?.(subject.path, error.message);

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
        onProblem?.(subject.path, error.message);

        return null;
      });
  };

  /**
   * Finds every file a correction should reach. Correcting one episode corrects the whole programme:
   * an identifier names a show, and fixing episode one while two to ten still point at the wrong
   * programme is worse than not offering the feature.
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
        and(eq(mediaItem.libraryId, row.libraryId), eq(mediaItem.seriesTitle, row.seriesTitle)),
      );

    return { libraryId: row.libraryId, paths: siblings.map((one) => one.path) };
  };

  /**
   * Reads a few named files again, now that a correction has said what they are, and writes what the
   * catalogue answers back over what was stored.
   *
   * @param libraryId - The library the files are in.
   * @param paths - The files to read again.
   * @param onProgress - The job to report progress against, where one is watching.
   */
  const readAgain = async (
    libraryId: string,
    paths: string[],
    onProgress?: (phase: ScanPhase, processed: number, total: number) => void,
  ): Promise<void> => {
    const rows = await db
      .select({
        path: mediaItem.path,
        sizeBytes: mediaItem.sizeBytes,
        modifiedAtMs: mediaItem.modifiedAtMs,
      })
      .from(mediaItem)
      .where(and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, paths)));

    await scanLibrary({
      libraryId,
      root: '',
      files: { listFiles: () => Promise.resolve({ files: rows, unreadable: [] }) },
      store,
      transcoder,
      providers: providers ?? [],
      force: true,
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
   * Where the queue already holds a re-read for this library it used to do the work in the request
   * after all, which is the one case it exists to avoid: a re-read with no job id appears in no
   * list of running work, reports no progress and cannot be stopped. It answers with the job that
   * is already reading instead, and the paths are picked up by the scan that follows — a re-read
   * works from what the files say, not from a list it was handed.
   *
   * @param libraryId - The library the files are in.
   * @param paths - The files to read again.
   * @returns The job reading these files, or null where there is none and none could be started.
   */
  const queueReadAgain = async (libraryId: string, paths: string[]): Promise<string | null> => {
    const jobId = await jobs.enqueue(READ_AGAIN_JOB, { libraryId, paths }, libraryId);

    return jobId ?? (await jobs.liveJob(READ_AGAIN_JOB, libraryId));
  };

  const findLibrary = async (id: string) => {
    const rows = await db.select().from(library).where(eq(library.id, id)).limit(1);

    return rows[0] ?? null;
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
    found: { id: string; path: string },
    force: boolean,
    jobId: string | undefined,
  ): Promise<ScanResult> =>
    scanLibrary({
      libraryId: found.id,
      root: found.path,
      files,
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
            onProgress: (phase, processed, total) =>
              jobs.reportProgress(jobId, phase, processed, total),
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

    return scanBookLibrary({
      libraryId: found.id,
      root: found.path,
      files,
      store: books,
      force,
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
              jobs.reportProgress(jobId, 'probing', processed, total),
            isCancelled: () => jobs.isCancelled(jobId),
          }),
    });
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
      files: { ...music.files, listFiles: files.listFiles },
      store: music.store,
      artwork: music.artwork,
      force,
      isPartial,
      ...(onProblem === undefined ? {} : { onProblem }),
      ...(jobId === undefined
        ? {}
        : {
            onProgress: (processed, total) =>
              jobs.reportProgress(jobId, 'probing', processed, total),
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
   * or what the server thinks it can manage. A library on a network share wants one — the files arrive
   * down one wire, and asking for four divides that wire four ways and adds seeking to it.
   *
   * @param libraryId - The library being worked on.
   * @returns How many files to render at the same time.
   */
  const filesAtOnceFor = async (libraryId: string): Promise<number> =>
    filesAtOnce((await findLibrary(libraryId))?.filesAtOnce ?? atOnce, await rendersAtOnce());

  /**
   * Reads what the last scan of a library actually changed. "Scanned an hour ago" and "scanned an hour
   * ago and removed two hundred items" answer the same question, and only the second tells an operator
   * their mount was missing.
   *
   * @param row - The library row as stored.
   * @returns The counts from the last scan, or null where none has run since Valence began recording.
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

  const service: DatabaseLibraryService = {
    list: async (viewer) => {
      const rows = await db
        .select({
          id: library.id,
          name: library.name,
          kind: library.kind,
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
          itemCount: sql<number>`(case when ${library.kind} = 'books' then count(distinct ${bookChapter.id}) else count(distinct ${mediaItem.id}) end)::int`,
        })
        .from(library)
        .leftJoin(mediaItem, eq(mediaItem.libraryId, library.id))
        .leftJoin(book, eq(book.libraryId, library.id))
        .leftJoin(bookChapter, eq(bookChapter.bookId, book.id))
        .where(librariesVisibleToViewer(db, viewer))
        .groupBy(library.id)
        .orderBy(asc(library.name));

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: LibraryKindSchema.parse(row.kind),
        path: row.path,
        itemCount: row.itemCount,
        lastScannedAt: toIso(row.lastScannedAt),
        ...readLastScan(row),
        defaultAudioLanguage: row.defaultAudioLanguage,
        filesAtOnce: row.filesAtOnce,
        takesRequests: row.takesRequests,
        requestProfileId: row.requestProfileId,
        requestPath: row.requestPath,
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
      };
    },

    update: async (libraryId, input) => {
      const before = await findLibrary(libraryId);

      if (before === null) {
        return null;
      }

      await db
        .update(library)
        .set({
          defaultAudioLanguage: input.defaultAudioLanguage,
          ...(input.filesAtOnce === undefined ? {} : { filesAtOnce: input.filesAtOnce }),
          ...(input.takesRequests === undefined ? {} : { takesRequests: input.takesRequests }),
          ...(input.requestProfileId === undefined
            ? {}
            : { requestProfileId: input.requestProfileId }),
          ...(input.requestPath === undefined ? {} : { requestPath: input.requestPath }),
        })
        .where(eq(library.id, libraryId));

      if (before.defaultAudioLanguage !== input.defaultAudioLanguage) {
        await clearJobCompletions(db, libraryId, REGENERATE_PREVIEWS_JOB);
      }

      const [row] = await db
        .select({
          id: library.id,
          name: library.name,
          kind: library.kind,
          path: library.path,
          lastScannedAt: library.lastScannedAt,
          defaultAudioLanguage: library.defaultAudioLanguage,
          filesAtOnce: library.filesAtOnce,
          takesRequests: library.takesRequests,
          requestProfileId: library.requestProfileId,
          requestPath: library.requestPath,
          itemCount: sql<number>`(case when ${library.kind} = 'books' then count(distinct ${bookChapter.id}) else count(distinct ${mediaItem.id}) end)::int`,
        })
        .from(library)
        .leftJoin(mediaItem, eq(mediaItem.libraryId, library.id))
        .leftJoin(book, eq(book.libraryId, library.id))
        .leftJoin(bookChapter, eq(bookChapter.bookId, book.id))
        .where(eq(library.id, libraryId))
        .groupBy(library.id);

      if (row === undefined) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        kind: LibraryKindSchema.parse(row.kind),
        path: row.path,
        itemCount: row.itemCount,
        lastScannedAt: toIso(row.lastScannedAt),
        defaultAudioLanguage: row.defaultAudioLanguage,
        filesAtOnce: row.filesAtOnce,
        takesRequests: row.takesRequests,
        requestProfileId: row.requestProfileId,
        requestPath: row.requestPath,
      };
    },

    listFacets: async (viewer) => {
      const genreRows = await db
        .select({ value: sql<string>`genre` })
        .from(
          sql`${mediaItem}, jsonb_array_elements_text(coalesce(${mediaItem.genres}, '[]'::jsonb)) as genre`,
        )
        .where(and(isNull(mediaItem.extraKind), isNotATrack(db), visibleToViewer(db, viewer)))
        .groupBy(sql`genre`)
        .orderBy(sql`genre asc`);

      const decadeRows = await db
        .select({ value: sql<number>`((${mediaItem.year} / 10) * 10)::int` })
        .from(mediaItem)
        .where(
          and(
            isNotNull(mediaItem.year),
            isNull(mediaItem.extraKind),
            isNotATrack(db),
            visibleToViewer(db, viewer),
          ),
        )
        .groupBy(sql`(${mediaItem.year} / 10) * 10`)
        .orderBy(sql`(${mediaItem.year} / 10) * 10 desc`);

      const [best] = await db
        .select({ rating: sql<number>`coalesce(max(${mediaItem.rating}), 0)::float` })
        .from(mediaItem)
        .where(and(isNull(mediaItem.extraKind), isNotATrack(db), visibleToViewer(db, viewer)));

      return {
        genres: genreRows.map((row) => row.value),
        decades: decadeRows.map((row) => row.value),
        maxRating: best?.rating ?? 0,
      };
    },

    listItems: async (viewer, libraryId, options) => {
      if (!(await libraryVisible(viewer, libraryId))) {
        return null;
      }

      const asked = [
        eq(mediaItem.libraryId, libraryId),
        isNotATrack(db),
        visibleToViewer(db, viewer),
        ...(options.search === undefined || options.search.trim() === ''
          ? []
          : [matchesSearch(options.search)]),
        ...(options.kind === undefined
          ? []
          : [
              options.kind === 'shows'
                ? isNotNull(mediaItem.seriesTitle)
                : isNull(mediaItem.seriesTitle),
            ]),
        ...(options.genre === undefined || options.genre === ''
          ? []
          : [sql`${mediaItem.genres} @> ${JSON.stringify([options.genre])}::jsonb`]),
        ...(options.yearFrom === undefined ? [] : [gte(mediaItem.year, options.yearFrom)]),
        ...(options.yearTo === undefined ? [] : [lte(mediaItem.year, options.yearTo)]),
        ...(options.minRating === undefined ? [] : [gte(mediaItem.rating, options.minRating)]),
        ...(options.ids === undefined
          ? [isNull(mediaItem.extraKind)]
          : options.ids.length === 0
            ? [sql`false`]
            : [inArray(mediaItem.id, options.ids)]),
        ...(options.minYourStars === undefined || options.profileId === undefined
          ? []
          : [gte(yourStars(options.profileId), options.minYourStars)]),
      ];

      const filters = and(...asked);

      const [totals] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(mediaItem)
        .where(filters);

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
          sizeBytes: mediaItem.sizeBytes,
          posterUrl: mediaItem.posterUrl,
          backdropUrl: mediaItem.backdropUrl,
          logoUrl: mediaItem.logoUrl,
          seriesId: mediaItem.seriesId,
          seriesTitle: mediaItem.seriesTitle,
          seasonNumber: mediaItem.seasonNumber,
          episodeNumber: mediaItem.episodeNumber,
          rating: mediaItem.rating,
          externalId: mediaItem.externalId,
          genres: mediaItem.genres,
        })
        .from(mediaItem)
        .where(filters)
        .orderBy(...orderingFor(options))
        .limit(options.limit)
        .offset(options.offset);

      const items = rows.map(({ posterUrl, backdropUrl, logoUrl, genres, ...row }) => ({
        ...row,
        addedAt: row.addedAt.toISOString(),
        hasPoster: posterUrl !== null,
        posterUrl,
        externalId: row.externalId,
        hasBackdrop: backdropUrl !== null,
        hasLogo: logoUrl !== null,
        genres: readGenres(JsonValueSchema.parse(genres ?? null)),
      })) satisfies MediaSummary[];

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
        .where(eq(series.id, seriesId))
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
            : and(eq(mediaItem.seriesId, scope.seriesId), isNull(mediaItem.extraKind));

      if (where === null) {
        return [];
      }

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
          backdropUrl: mediaItem.backdropUrl,
          logoUrl: mediaItem.logoUrl,
          seriesId: mediaItem.seriesId,
          seriesTitle: mediaItem.seriesTitle,
          seasonNumber: mediaItem.seasonNumber,
          episodeNumber: mediaItem.episodeNumber,
          rating: mediaItem.rating,
          externalId: mediaItem.externalId,
          genres: mediaItem.genres,
        })
        .from(mediaItem)
        .where(where)
        .orderBy(asc(mediaItem.seasonNumber), asc(mediaItem.episodeNumber), asc(mediaItem.title))
        .limit(EVERY_EPISODE);

      return rows.map(({ posterUrl, backdropUrl, logoUrl, genres, ...row }) => ({
        ...row,
        addedAt: row.addedAt.toISOString(),
        hasPoster: posterUrl !== null,
        posterUrl,
        externalId: row.externalId,
        hasBackdrop: backdropUrl !== null,
        hasLogo: logoUrl !== null,
        genres: readGenres(JsonValueSchema.parse(genres ?? null)),
      })) satisfies MediaSummary[];
    },

    findByPerson: async (viewer, personId) => {
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
          backdropUrl: mediaItem.backdropUrl,
          logoUrl: mediaItem.logoUrl,
          seriesId: mediaItem.seriesId,
          seriesTitle: mediaItem.seriesTitle,
          seasonNumber: mediaItem.seasonNumber,
          episodeNumber: mediaItem.episodeNumber,
          rating: mediaItem.rating,
          externalId: mediaItem.externalId,
          genres: mediaItem.genres,
        })
        .from(mediaItem)
        .where(
          and(
            sql`${mediaItem.castMembers} @> ${JSON.stringify([{ personId }])}::jsonb`,
            isNull(mediaItem.extraKind),
            visibleToViewer(db, viewer),
          ),
        )
        .orderBy(asc(mediaItem.title))
        .limit(CREDITS_LIMIT);

      return rows.map(({ posterUrl, backdropUrl, logoUrl, genres, ...row }) => ({
        ...row,
        addedAt: row.addedAt.toISOString(),
        hasPoster: posterUrl !== null,
        posterUrl,
        externalId: row.externalId,
        hasBackdrop: backdropUrl !== null,
        hasLogo: logoUrl !== null,
        genres: readGenres(JsonValueSchema.parse(genres ?? null)),
      })) satisfies MediaSummary[];
    },

    readPerson: async (personId) => {
      const asking = (providers ?? []).find((provider) => provider.readPerson !== undefined);

      return (await asking?.readPerson?.(personId)) ?? null;
    },

    isOutOfReach: async (accountId, mediaId) => {
      const asThem: Viewer = {
        kind: 'account',
        accountId,
        profileId: null,
        isAdministrator: false,
      };

      const rows = await db
        .select({ reachable: sql<boolean>`coalesce(${reachableByViewer(db, asThem)}, true)` })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      return rows.length > 0 && rows[0]?.reachable === false;
    },

    isSeriesOutOfReach: async (accountId, seriesId) => {
      const asThem: Viewer = {
        kind: 'account',
        accountId,
        profileId: null,
        isAdministrator: false,
      };

      const rows = await db
        .select({ reachable: sql<boolean>`coalesce(${reachableByViewer(db, asThem)}, true)` })
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
      await db
        .insert(libraryBlock)
        .values({ userId: accountId, libraryId, blockedAt: new Date() })
        .onConflictDoNothing();
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
      await db
        .insert(ageCeiling)
        .values({
          userId: accountId,
          libraryId: ceiling.libraryId,
          maximumAge: ceiling.maximumAge,
          allowsUnrated: ceiling.allowsUnrated,
          setAt: new Date(),
        })
        .onConflictDoUpdate({
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

      await db
        .insert(ageException)
        .values({
          id: randomUUID(),
          userId: accountId,
          mediaItemId: subject.kind === 'item' ? subject.subjectId : null,
          seriesId: subject.kind === 'series' ? subject.subjectId : null,
          effect,
          grantedBy,
          grantedAt: new Date(),
        })
        .onConflictDoUpdate({
          target:
            subject.kind === 'item'
              ? [ageException.userId, ageException.mediaItemId]
              : [ageException.userId, ageException.seriesId],
          set: { effect, grantedBy, grantedAt: new Date() },
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
        )
        .returning({ id: ageException.id });

      return gone.length > 0;
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
        .where(and(eq(mediaItem.id, id), isNotATrack(db)))
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
          extraKind: mediaItem.extraKind,
          versionLabel: mediaItem.versionLabel,
          parentId: mediaItem.parentId,
          sizeBytes: mediaItem.sizeBytes,
        })
        .from(mediaItem)
        .where(eq(mediaItem.parentId, id))
        .orderBy(asc(mediaItem.extraKind), asc(mediaItem.title));

      const detail: MediaDetail = MediaDetailSchema.parse({
        id: row.id,
        libraryId: row.libraryId,
        parentId: row.parentId,
        extraKind: row.extraKind,
        versionLabel: row.versionLabel,
        trailerKey: row.trailerKey,
        previewMoment: await store.readPreviewMoment(row.libraryId, row.path),
        extras: held
          .filter((one) => one.extraKind !== null)
          .map(({ posterUrl, ...extra }) => ({
            ...extra,
            addedAt: extra.addedAt.toISOString(),
            hasPoster: posterUrl !== null,
            posterUrl,
            hasBackdrop: false,
            hasLogo: false,
          })),
        versions: held
          .filter((one) => one.extraKind === null)
          .map(({ posterUrl, ...version }) => ({
            ...version,
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
          overview: row.overview,
          tagline: row.tagline,
          genres: row.genres,
          cast: row.castMembers,
          rating: row.rating,
          hasPoster: row.posterUrl !== null,
          externalId: row.externalId,
          hasBackdrop: row.backdropUrl !== null,
          hasLogo: row.logoUrl !== null,
          seriesTitle: row.seriesTitle,
          seasonNumber: row.seasonNumber,
          episodeNumber: row.episodeNumber,
        },
      });

      return detail;
    },

    readArtworkUrl: async (mediaId, kind) => {
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
      await db.delete(library).where(eq(library.id, libraryId));
      await jobs.enqueue(CLEANUP_ARTEFACT_CACHE_JOB, {}, CLEANUP_ARTEFACT_CACHE_JOB);

      return true;
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
              onProgress: (done, total) => jobs.reportProgress(jobId, 'clearing', done, total),
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
      };
    },

    runReadAgain: async (libraryId, paths, jobId) => {
      await readAgain(
        libraryId,
        paths,
        jobId === undefined
          ? undefined
          : (phase, processed, total) => jobs.reportProgress(jobId, phase, processed, total),
      );
    },

    runScanFolder: async (libraryId, folder, jobId) => {
      const found = await findLibrary(libraryId);

      if (found === null || (found.kind !== 'movies' && found.kind !== 'shows')) {
        return found?.kind === 'music'
          ? scanMusic({ id: libraryId, path: folder }, false, jobId, true)
          : null;
      }

      return scanLibrary({
        libraryId,
        root: folder,
        files,
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
                jobs.reportProgress(jobId, phase, processed, total),
            }),
      });
    },

    findByCatalogueId: async (libraryId, kind, externalId) => {
      if (kind === 'series') {
        const [found] = await db
          .select({ id: series.id })
          .from(series)
          .where(and(eq(series.libraryId, libraryId), eq(series.externalId, externalId)))
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
                jobs.reportProgress(jobId, 'previews', processed, total),
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
              onProgress: (done, total) => jobs.reportProgress(jobId, 'logos', done, total),
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
                jobs.reportProgress(jobId, 'trickplay', processed, total),
              isCancelled: () => jobs.isCancelled(jobId),
            }),
      });
    },

    listShows: async (viewer, libraryId) => {
      const page = await service.listItems(viewer, libraryId, {
        kind: 'shows',
        limit: EVERY_EPISODE,
        offset: 0,
      });

      return page === null ? null : groupIntoShows(page.items);
    },

    getShow: async (viewer, libraryId, showId) => {
      const page = await service.listItems(viewer, libraryId, {
        kind: 'shows',
        limit: EVERY_EPISODE,
        offset: 0,
      });

      const detail = page === null ? null : buildShowDetail(page.items, showId);

      if (detail === null) {
        return null;
      }

      const shape = await shapeOf(detail);
      const extras = await extrasOfShow(viewer, libraryId, detail);

      const [cover] = await db
        .select({ trailerKey: mediaItem.trailerKey })
        .from(mediaItem)
        .where(eq(mediaItem.id, detail.coverMediaId))
        .limit(1);

      const whole = { ...detail, extras, trailerKey: cover?.trailerKey ?? null };

      return shape === null ? whole : { ...whole, shape: shape.seasons };
    },
  };

  return service;
};

export { createDatabaseLibraryService };
