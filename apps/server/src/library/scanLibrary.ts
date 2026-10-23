import { joinedProbe } from '@ValenceServer/library/joinedProbe';
import { discFolderOf } from '@ValenceServer/library/naming/discFolderOf';
import { keepMainDiscStreams } from '@ValenceServer/library/placement/keepMainDiscStreams';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { isMediaFile } from './isMediaFile';
import { resolveMetadata } from './MetadataProvider';
import { createFilenameMetadataProvider } from './createFilenameMetadataProvider';
import { describeQuality } from './describeQuality';
import { nameOfFile } from './nameOfFile';
import { placeInLibrary } from './placement/placeInLibrary';
import { readNfoIds } from './naming/readNfoIds';
import { NOT_AN_EPISODE } from './placement/NOT_AN_EPISODE';
import { NO_IDS } from './placement/NO_IDS';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import type { Metadata, MetadataProvider } from './MetadataProvider';
import type { EpisodeNumbering } from './EpisodeNumbering.types';
import type { ExternalIds } from './naming/ExternalIds.types';
import type { MediaProbe, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { ExtraKind, ScanResult } from '@ValenceContracts/schemas/Library';
import { saying } from '@ValenceI18n/saying';
import { seriesFolderUnder } from './placement/seriesFolderUnder';
import { filesToLookUpAgain } from './filesToLookUpAgain';
import { reachOfEachSeries } from './reachOfEachSeries';

const KEPT_MISSING_FOR_MS = 30 * 24 * 60 * 60 * 1000;

type ScannedFile = {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
};

type ScanFindings = {
  files: ScannedFile[];
  unreadable: string[];
  leftOut?: string[];
};

type StoredItem = {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
  externalId: string | null;
  videoBitDepth: number | null;
  videoRangeBase: string | null;
  canCopySegments: boolean | null;
  videoFrameRate: number | null;
  probeVersion: number | null;
  missingSince?: Date | null;
  parts?: readonly StoredPart[];
};

type StoredPart = { path: string; sizeBytes: number; modifiedAtMs: number };

type FilePart = StoredPart & { durationSeconds: number };

type MediaRow = {
  libraryId: string;
  path: string;
  title: string;
  year: number | null;
  sizeBytes: number;
  modifiedAtMs: number;
  probe: MediaProbe;
  probeVersion: number | null;
  metadata: Metadata;
  episode: EpisodeNumbering;
  extraKind: ExtraKind | null;
  versionLabel: string | null;
  isCorrected?: boolean;
  parts?: readonly FilePart[];
};

type MediaFileSystem = {
  listFiles: (root: string) => Promise<ScanFindings>;
  readText?: (path: string) => Promise<string | null>;
};

type MediaOverride = {
  path: string;
  externalId: string;
  externalKind: 'tv' | 'movie';
};

type ScannedItem = {
  itemId: string;
  title: string;
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  year: number | null;
  posterUrl: string | null;
  overview: string | null;
  durationSeconds: number | null;
  genres: string[];
  rating: number | null;
  quality: string | null;
};

type MediaStore = {
  listStored: (libraryId: string) => Promise<StoredItem[]>;
  upsert: (row: MediaRow) => Promise<string | null>;
  removeByPaths: (libraryId: string, paths: string[]) => Promise<ScannedItem[]>;
  setAside?: (libraryId: string, paths: string[], now: Date) => Promise<string[]>;
  markFound?: (libraryId: string, paths: string[]) => Promise<void>;
  listMissingSince?: (libraryId: string, before: Date) => Promise<string[]>;
  listOverrides?: (libraryId: string) => Promise<MediaOverride[]>;
  linkExtras?: (libraryId: string, links: { path: string; parentPath: string }[]) => Promise<void>;
  forgetStaleVersions?: (libraryId: string, stillVersions: string[]) => Promise<void>;
  linkSameFilms?: (libraryId: string) => Promise<void>;
  regroupSeries?: (libraryId: string, foldersByPath: Map<string, string>) => Promise<void>;
  forgetEmptySeries?: (libraryId: string) => Promise<void>;
  markScanned: (libraryId: string) => Promise<void>;
};

type ScanLibraryOptions = {
  libraryId: string;
  kind: 'movies' | 'shows' | 'anime';
  root: string;
  within?: string;
  files: MediaFileSystem;
  store: MediaStore;
  transcoder: Transcoder;
  providers?: MetadataProvider[];
  force?: boolean;
  isPartial?: boolean;
  atOnce?: number;
  onProblem?: (path: string, reason: Said) => void;
  onProgress?: (phase: ScanPhase, processed: number, total: number, item?: string) => void;
  onAdded?: (item: ScannedItem) => void;
  onRemoved?: (items: ScannedItem[]) => void;
  isCancelled?: () => boolean;
};

type ScanPhase = 'probing';

const GIVE_UP_AFTER = 8;

/**
 * Asks whether the media service is still there.
 *
 * Used only once a run of files has failed in a row. One file that will not probe is a bad file;
 * every file failing is the service having gone, and the difference decides whether a scan carries
 * on or stops.
 *
 * @param transcoder - The media service to ask.
 * @returns Whether it answered.
 */
const isReachable = async (transcoder: Transcoder): Promise<boolean> => {
  try {
    await transcoder.capabilities();

    return true;
  } catch {
    return false;
  }
};

/**
 * Indexes the corrections somebody has made by the programme they were made against, so one can
 * reach a file that did not exist when it was made.
 *
 * A correction is stored against each path it covered at the time, which is every file the
 * programme had then. A season that airs afterwards is downloaded into the same folder and has no
 * correction of its own, so it was looked up by title like anything new — and landed on exactly the
 * programme the correction existed to move it off. Worse than wrong lettering: the catalogue
 * identifier is what groups files into a show, so the new season arrived as a second show beside
 * the corrected one.
 *
 * Keyed by the folder rather than by the title, because the folder is what does not move. A
 * correction usually changes what the programme is called, so the title on the stored rows is the
 * corrected one while a new file still parses to whatever the folder says.
 *
 * Films cannot be caught by this. A path with no episode numbering in it has no series folder at
 * all, so nothing groups two films that happen to share a directory.
 *
 * @param corrections - Every correction held for the library.
 * @returns The correction for each programme, by its folder.
 */
const correctionsBySeries = (
  corrections: MediaOverride[],
  seriesFolders: Map<string, string>,
): Map<string, MediaOverride> => {
  const bySeries = new Map<string, MediaOverride>();

  for (const correction of corrections) {
    const folder = seriesFolders.get(correction.path) ?? null;

    if (folder !== null && !bySeries.has(folder)) {
      bySeries.set(folder, correction);
    }
  }

  return bySeries;
};

/**
 * The catalogue identifier already held for each programme, taken from the episodes of it that were
 * read successfully before.
 *
 * What this recovers is the episode a lookup failed on. Its neighbours in the same folder carry the
 * programme's identifier, so rather than searching a catalogue again for a title that did not match
 * the first time, the episode is read straight from the programme its folder already named. A
 * season that came back half-lettered fills itself in on the next scan instead of staying that way.
 *
 * @param stored - What the database already holds about the library.
 * @param seriesFolders - The folder each file's programme is filed under.
 * @returns The identifier known for each programme's folder.
 */
const catalogueIdsBySeries = (
  stored: StoredItem[],
  seriesFolders: Map<string, string>,
): Map<string, string> => {
  const byFolder = new Map<string, string>();

  for (const item of stored) {
    const folder = seriesFolders.get(item.path);

    if (folder === undefined || item.externalId === null || byFolder.has(folder)) {
      continue;
    }

    byFolder.set(folder, item.externalId);
  }

  return byFolder;
};

/**
 * The correction that governs a file: its own, or the one made against the programme it belongs to.
 *
 * @param path - The file being read.
 * @param seriesFolder - The programme's folder, where the file is an episode of one.
 * @param byPath - Corrections against a path.
 * @param bySeries - Corrections against a programme.
 * @returns The correction to honour, or null where none was made.
 */
const correctionFor = (
  path: string,
  seriesFolder: string | null,
  byPath: Map<string, MediaOverride>,
  bySeries: Map<string, MediaOverride>,
): MediaOverride | null => {
  const own = byPath.get(path);

  if (own !== undefined) {
    return own;
  }

  return (seriesFolder === null ? undefined : bySeries.get(seriesFolder)) ?? null;
};

/**
 * Decides which of a library's files actually need probing: the ones that are new, and the ones
 * whose size or modification time has moved since they were last read. Probing launches a process
 * per file, so a library of twenty thousand that has gained two should cost two probes. A film kept
 * as several files is stored as long and as large as its parts together, so its first part is
 * measured against what was stored for that part.
 *
 * @param found - Every file on disk now.
 * @param stored - What the database holds about them.
 * @param probeVersion - Which version of the probing rules this build applies, so a row worked out
 *   under an older one is worked out again. Nothing to compare against where it is not known, since
 *   a transcoder that could not be asked is a reason to leave the library alone rather than to
 *   probe all of it.
 *
 *   Whether segments can be copied is not among the things worth probing again for. A probe no
 *   longer answers it — a session works it out when it starts — so a row that does not carry it is
 *   complete rather than half read.
 * @returns The files to probe.
 */
const selectChanged = (
  found: ScannedFile[],
  stored: StoredItem[],
  probeVersion: number | null = null,
): { changed: ScannedFile[]; missing: string[] } => {
  const storedByPath = new Map(stored.map((item) => [item.path, item]));
  const foundPaths = new Set(found.map((file) => file.path));

  const changed = found.filter((file) => {
    const existing = storedByPath.get(file.path);
    const asFound = existing?.parts?.[0] ?? existing;

    return (
      existing === undefined ||
      asFound?.sizeBytes !== file.sizeBytes ||
      asFound.modifiedAtMs !== file.modifiedAtMs ||
      existing.videoBitDepth === null ||
      existing.videoRangeBase === null ||
      existing.videoFrameRate === null ||
      (probeVersion !== null && existing.probeVersion !== probeVersion)
    );
  });

  const missing = stored.map((item) => item.path).filter((path) => !foundPaths.has(path));

  return { changed, missing };
};

/**
 * Whether a film kept as several files is stored joined from exactly the parts it has now, each
 * the size and age it was, so a scan reads its parts again only where one of them changed.
 *
 * @param stored - The parts it was stored with.
 * @param parts - Its parts now, in order.
 * @param listed - The files found, by path.
 * @returns Whether it is still the film it was stored as.
 */
const isStillJoined = (
  stored: readonly StoredPart[],
  parts: readonly string[],
  listed: ReadonlyMap<string, ScannedFile>,
): boolean =>
  stored.length === parts.length &&
  parts.every((path, at) => {
    const was = stored[at];
    const now = listed.get(path);

    return (
      was !== undefined &&
      now !== undefined &&
      was.path === path &&
      was.sizeBytes === now.sizeBytes &&
      was.modifiedAtMs === now.modifiedAtMs
    );
  });

/**
 * Whether a film kept as several files has lost some of its parts while others are still there.
 *
 * Such a film is held as it was stored rather than read again from what is left, which would make
 * it as long as one part, or turn a part that is left into a film of its own. It is set aside as
 * missing like any other file that went, and is the film it was again once its parts are back.
 *
 * @param item - The film as stored.
 * @param listed - The paths found.
 * @returns Whether some of its parts are found and some are not.
 */
const isMissingAPart = (item: StoredItem, listed: ReadonlySet<string>): boolean => {
  const parts = item.parts ?? [];

  return (
    parts.length > 1 &&
    parts.some((part) => listed.has(part.path)) &&
    parts.some((part) => !listed.has(part.path))
  );
};

/**
 * Reads every part of a film kept as several files and describes the film they play as together,
 * or nothing where their streams are not alike enough to be read as one input. A part that cannot
 * be read at all is not a part that differs, so that refuses rather than answering nothing.
 *
 * @param transcoder - What reads a file.
 * @param parts - The parts, in order.
 * @param listed - The files found, by path.
 * @returns The film and each part with its length, or null.
 */
const readParts = async (
  transcoder: Transcoder,
  parts: readonly string[],
  listed: ReadonlyMap<string, ScannedFile>,
): Promise<{ probe: MediaProbe; parts: FilePart[] } | null> => {
  const probes: MediaProbe[] = [];

  for (const part of parts) {
    probes.push(await transcoder.probe(part));
  }

  const probe = joinedProbe(probes);

  return probe === null
    ? null
    : {
        probe,
        parts: parts.map((path, at) => ({
          path,
          sizeBytes: listed.get(path)?.sizeBytes ?? 0,
          modifiedAtMs: listed.get(path)?.modifiedAtMs ?? 0,
          durationSeconds: probes[at]?.durationSeconds ?? 0,
        })),
      };
};

/**
 * Walks a library root and brings the database in line with what is actually there: probing what is
 * new or changed, asking the metadata providers about each, and removing rows for files that have
 * gone. A file gone with no other copy to take its place is set aside as missing instead, keeping
 * what viewers have of it, and removed once it has been missing for 30 days. One an administrator
 * left out is removed at once, as is one still there but no longer read as a title, such as a
 * sample, and a stream of a Blu-ray whose film plays from another of its streams. A film kept as
 * several files that has lost some of its parts is held as it was and set aside as missing, and one
 * whose parts cannot be read this time is left as it was until a scan can. Reports its progress as
 * it goes, since a first scan of a real library takes minutes.
 *
 * @param options - The library's root, which decides the folder each programme is filed under, and
 *   the folder under it to walk where that is only part of the library; what to write to, who to
 *   ask about files, how many to work on at once, and where to report progress and problems.
 * @returns What the scan changed, counted.
 */
/**
 * The programme folders a scan files episodes by again: every one where it walked the whole
 * library, but where it read only part of it just the programmes it read, so reading one programme
 * again never moves another's episodes.
 *
 * @param seriesFolders - The folder of the programme each file in the library belongs to.
 * @param found - The files the scan read.
 * @param isPartial - Whether it read only part of the library.
 * @returns The folder of each file to file again, by its path.
 */
const foldersToRegroup = (
  seriesFolders: Map<string, string>,
  found: readonly ScannedFile[],
  isPartial: boolean,
): Map<string, string> => {
  if (!isPartial) {
    return seriesFolders;
  }

  const read = new Set(found.flatMap((file) => seriesFolders.get(file.path) ?? []));

  return new Map([...seriesFolders].filter(([, folder]) => read.has(folder)));
};

/**
 * Asks the transcoder which version of its probing rules this build applies.
 *
 * Answers nothing where it cannot be reached, which leaves every stored row alone. The alternative
 * — treating an unreachable transcoder as a version mismatch — would reprobe an entire library
 * because a container was restarting.
 *
 * @param transcoder - The transcoder to ask.
 * @returns The version, or nothing if it could not be had.
 */
const readProbeVersion = async (transcoder: Transcoder): Promise<number | null> => {
  try {
    return (await transcoder.capabilities()).probeVersion;
  } catch {
    return null;
  }
};

const scanLibrary = async ({
  libraryId,
  kind,
  root,
  within = root,
  files,
  store,
  transcoder,
  providers = [createFilenameMetadataProvider()],
  force = false,
  isPartial: askedPartial = false,
  atOnce = 1,
  onProblem,
  onProgress,
  onAdded,
  onRemoved,
  isCancelled,
}: ScanLibraryOptions): Promise<ScanResult> => {
  const isPartial = askedPartial || within !== root;
  const walked = await files.listFiles(within);
  const onDisk = keepMainDiscStreams(walked.files.filter((file) => isMediaFile(file.path)));
  const listedPaths = new Set(onDisk.map((file) => file.path));
  const isPlaceable = (path: string): boolean =>
    listedPaths.has(path) || discFolderOf(path) === null;
  const stored = await store.listStored(libraryId);
  const heldApart = stored.filter((item) => isMissingAPart(item, listedPaths));
  const heldFilms = new Set(heldApart.map((item) => item.path));
  const heldParts = new Set(
    heldApart.flatMap((item) => (item.parts ?? []).map((part) => part.path)),
  );
  const listed = onDisk.filter((file) => !heldParts.has(file.path));
  const probeVersion = await readProbeVersion(transcoder);
  const corrections = (await store.listOverrides?.(libraryId)) ?? [];

  const scope = isPartial && kind !== 'movies' ? seriesFolderUnder(root, within) : null;
  const isInScope = (path: string): boolean => scope === null || path.startsWith(`${scope}/`);
  const placeable = [
    ...new Set([
      ...listed.map((file) => file.path),
      ...stored
        .map((item) => item.path)
        .filter(isInScope)
        .filter(isPlaceable),
      ...corrections
        .map((one) => one.path)
        .filter(isInScope)
        .filter(isPlaceable),
    ]),
  ].filter((path) => !heldParts.has(path));
  const listedByPath = new Map(listed.map((file) => [file.path, file]));
  const storedParts = new Map(stored.map((item) => [item.path, item.parts ?? []]));
  const firstPlaced = placeInLibrary(kind, placeable, root);
  const joined = new Map<string, { probe: MediaProbe; parts: FilePart[] }>();
  const unjoined = new Set<string>();
  const unread = new Set<string>();

  for (const [first, placement] of firstPlaced) {
    const { parts } = placement;

    if (parts === undefined) {
      continue;
    }

    if (!parts.every((part) => listedByPath.has(part))) {
      unjoined.add(first);
      continue;
    }

    if (!force && isStillJoined(storedParts.get(first) ?? [], parts, listedByPath)) {
      continue;
    }

    const read =
      isCancelled?.() === true
        ? undefined
        : await readParts(transcoder, parts, listedByPath).catch((error) => {
            onProblem?.(
              first,
              error instanceof Error
                ? sayVerbatim(describeFailure(error))
                : saying('server.library.scanLibrary.probeFailed'),
            );

            return undefined;
          });

    if (read === undefined) {
      for (const part of parts) {
        unread.add(part);
      }

      continue;
    }

    if (read === null) {
      unjoined.add(first);
      onProblem?.(first, saying('server.library.scanLibrary.thePartsOfThisFilmCannotBe'));
      continue;
    }

    joined.set(first, read);
  }

  const placed =
    unjoined.size === 0 ? firstPlaced : placeInLibrary(kind, placeable, root, unjoined);
  const laterParts = new Set(
    [...placed.values()].flatMap((placement) => placement.parts?.slice(1) ?? []),
  );
  const found = listed.filter(
    (file) => !unread.has(file.path) && placed.get(file.path)?.isIgnored !== true,
  );
  const extras = new Map(
    found.flatMap((file) => {
      const extra = placed.get(file.path)?.extra ?? null;

      return extra === null ? [] : [[file.path, extra] as const];
    }),
  );
  const versions = new Map(
    found.flatMap((file) => {
      const version = placed.get(file.path)?.version ?? null;

      return version === null ? [] : [[file.path, version] as const];
    }),
  );

  const seen = force
    ? { changed: found, missing: selectChanged(found, stored, probeVersion).missing }
    : selectChanged(found, stored, probeVersion);

  const hasVanished =
    found.length === 0 && heldParts.size === 0 && unread.size === 0 && stored.length > 0;
  const missing =
    isPartial || hasVanished
      ? []
      : seen.missing.filter((path) => !unread.has(path) && !isUnderAny(path, walked.unreadable));
  const knownPaths = new Set(stored.map((item) => item.path));
  const storedByPath = new Map(stored.map((item) => [item.path, item]));
  const overrides = new Map(corrections.map((one) => [one.path, one]));
  const seriesFolders = new Map(
    [...placed].flatMap(([path, placement]) =>
      placement.episode.seriesFolder === null || placement.extra !== null
        ? []
        : [[path, placement.episode.seriesFolder] as const],
    ),
  );
  const overridesBySeries = correctionsBySeries(corrections, seriesFolders);
  const catalogueBySeries = catalogueIdsBySeries(stored, seriesFolders);
  const reachBySeries = reachOfEachSeries(placed);
  const regrouped = found.filter((file) => {
    const parts = placed.get(file.path)?.parts ?? [];
    const before = storedParts.get(file.path) ?? [];

    return parts.length === 0 ? before.length > 0 : !isStillJoined(before, parts, listedByPath);
  });
  const changed = force
    ? seen.changed
    : [
        ...new Set([
          ...seen.changed,
          ...regrouped,
          ...filesToLookUpAgain(found, stored, seen.changed, seriesFolders, catalogueBySeries),
        ]),
      ];
  const nfoRead = new Map<string, Promise<ExternalIds | null>>();

  /**
   * Reads the identifiers the first `.nfo` file that exists among a file's holds, each file read
   * once however many episodes share it.
   *
   * @param paths - The `.nfo` files to try, in order.
   * @returns The identifiers found, or nothing.
   */
  const idsFromNfo = async (paths: readonly string[]): Promise<ExternalIds | null> => {
    const { readText } = files;

    if (readText === undefined) {
      return null;
    }

    for (const path of paths) {
      const reading =
        nfoRead.get(path) ??
        readText(path)
          .then((text) => (text === null ? null : readNfoIds(text)))
          .catch(() => null);

      nfoRead.set(path, reading);

      const ids = await reading;

      if (ids !== null && (ids.tmdb !== null || ids.imdb !== null || ids.tvdb !== null)) {
        return ids;
      }
    }

    return null;
  };

  await store.regroupSeries?.(libraryId, foldersToRegroup(seriesFolders, found, isPartial));

  let added = 0;
  let updated = 0;
  let failed = 0;
  let probed = 0;
  let failedInARow = 0;
  let stopping = false;

  onProgress?.('probing', probed, changed.length);

  const outcomes = await mapWithLimit(changed, atOnce, async (file): Promise<boolean> => {
    if (isCancelled?.() === true || stopping) {
      return false;
    }

    try {
      const asParts = placed.get(file.path)?.parts;
      const read =
        asParts === undefined
          ? null
          : (joined.get(file.path) ?? (await readParts(transcoder, asParts, listedByPath)));

      if (asParts !== undefined && read === null) {
        failed += 1;
        onProblem?.(file.path, saying('server.library.scanLibrary.thePartsOfThisFilmCannotBe'));

        return false;
      }

      const probe = read?.probe ?? (await transcoder.probe(file.path));

      if (probe.video === null) {
        failed += 1;
        onProblem?.(file.path, saying('server.library.scanLibrary.noVideoStream'));

        return false;
      }

      const placement = placed.get(file.path);
      const numbered = placement?.episode ?? NOT_AN_EPISODE;
      const episode = {
        ...numbered,
        seriesReach:
          numbered.seriesFolder === null
            ? null
            : (reachBySeries.get(numbered.seriesFolder) ?? null),
      };
      const extra = placement?.extra ?? null;
      const corrected = correctionFor(
        file.path,
        episode.seriesFolder,
        overrides,
        overridesBySeries,
      );
      const fromNames = placement?.ids ?? NO_IDS;
      const fromNfo = await idsFromNfo(placement?.nfoPaths ?? []);
      const ids: ExternalIds = {
        tmdb: fromNames.tmdb ?? fromNfo?.tmdb ?? null,
        imdb: fromNames.imdb ?? fromNfo?.imdb ?? null,
        tvdb: fromNames.tvdb ?? fromNfo?.tvdb ?? null,
      };
      const remembered = force
        ? null
        : episode.seriesFolder === null
          ? (storedByPath.get(file.path)?.externalId ?? null)
          : (catalogueBySeries.get(episode.seriesFolder) ??
            storedByPath.get(file.path)?.externalId ??
            null);
      const knownExternalId = corrected?.externalId ?? null;

      const metadata =
        extra === null
          ? await resolveMetadata(
              providers,
              {
                path: file.path,
                probe,
                episode,
                knownExternalId,
                ...(corrected === null ? {} : { knownExternalKind: corrected.externalKind }),
                title: placement?.title ?? nameOfFile(file.path),
                year: placement?.year ?? null,
                ids,
                rememberedExternalId: remembered,
              },
              (name, reason) =>
                onProblem?.(
                  file.path,
                  saying('server.library.scanLibrary.metadataProviderNameFailedReason', {
                    name,
                    reason,
                  }),
                ),
            )
          : { title: placement?.title ?? nameOfFile(file.path), year: placement?.year ?? null };

      if (metadata === null) {
        failed += 1;
        onProblem?.(
          file.path,
          saying('server.library.scanLibrary.noMetadataProviderCouldNameThis'),
        );

        return false;
      }

      const heldBefore = knownExternalId ?? storedByPath.get(file.path)?.externalId ?? null;

      if (heldBefore !== null && (metadata.externalId ?? null) === null) {
        failed += 1;
        onProblem?.(
          file.path,
          saying('server.library.scanLibrary.theCatalogueDidNotAnswerKeeping'),
        );

        return false;
      }

      const { title, year } = metadata;
      const filed =
        numbered.episodeNumber === null && metadata.episodeNumber !== undefined
          ? {
              ...numbered,
              seasonNumber: metadata.seasonNumber ?? numbered.seasonNumber,
              episodeNumber: metadata.episodeNumber,
            }
          : numbered.airDate !== null && numbered.seasonNumber === null
            ? { ...numbered, seasonNumber: 1 }
            : numbered;

      failedInARow = 0;

      const itemId = await store.upsert({
        libraryId,
        path: file.path,
        title,
        year,
        sizeBytes:
          read === null
            ? file.sizeBytes
            : read.parts.reduce((total, part) => total + part.sizeBytes, 0),
        modifiedAtMs: file.modifiedAtMs,
        probe,
        probeVersion,
        parts: read?.parts ?? [],
        metadata,
        episode: filed,
        extraKind: extra?.kind ?? null,
        versionLabel: versions.get(file.path)?.label ?? null,
        isCorrected: corrected !== null,
      });

      if (knownPaths.has(file.path)) {
        updated += 1;
      } else {
        added += 1;

        if (itemId !== null && extra === null && !versions.has(file.path)) {
          onAdded?.({
            itemId,
            title,
            seriesTitle: episode.seriesTitle ?? null,
            seasonNumber: filed.seasonNumber,
            episodeNumber: filed.episodeNumber,
            year,
            posterUrl: metadata.posterUrl ?? null,
            overview: metadata.overview ?? null,
            durationSeconds: probe.durationSeconds,
            genres: metadata.genres ?? [],
            rating: metadata.rating ?? null,
            quality: describeQuality(probe.video.width, probe.video.height, probe.video.range),
          });
        }
      }
    } catch (error) {
      failed += 1;
      failedInARow += 1;
      onProblem?.(
        file.path,
        error instanceof Error
          ? sayVerbatim(describeFailure(error))
          : saying('server.library.scanLibrary.probeFailed'),
      );

      if (failedInARow >= GIVE_UP_AFTER && !(await isReachable(transcoder))) {
        stopping = true;

        return true;
      }
    } finally {
      probed += 1;
      onProgress?.('probing', probed, changed.length, nameOfFile(file.path));
    }

    return false;
  });

  const hasGone = outcomes.some((gaveUp) => gaveUp);

  if (hasVanished) {
    onProblem?.(within, saying('server.library.scanLibrary.nothingWasFoundWhereThisLibrary'));
  }

  if (hasGone) {
    onProblem?.(within, saying('server.library.scanLibrary.theMediaServiceStoppedAnsweringSo'));

    return { added, updated, removed: 0, failed };
  }

  if (isCancelled?.() === true) {
    onProblem?.(within, saying('server.library.scanLibrary.thisScanWasStoppedBeforeIt'));

    return { added, updated, removed: 0, failed };
  }

  const links = [
    ...[...extras]
      .map(([path, one]) => ({ path, parentPath: one.parentPath }))
      .filter((one): one is { path: string; parentPath: string } => one.parentPath !== null),
    ...[...versions].map(([path, one]) => ({ path, parentPath: one.parentPath })),
  ];

  if (links.length > 0) {
    await store.linkExtras?.(libraryId, links);
  }

  if (!isPartial && !hasVanished) {
    await store.forgetStaleVersions?.(libraryId, [
      ...versions.keys(),
      ...stored.map((item) => item.path).filter((path) => isUnderAny(path, walked.unreadable)),
    ]);
  }

  const now = new Date();
  const returned = found
    .filter((file) => (storedByPath.get(file.path)?.missingSince ?? null) !== null)
    .map((file) => file.path);

  if (returned.length > 0) {
    await store.markFound?.(libraryId, returned);
  }

  const leftOut = new Set(walked.leftOut ?? []);
  const listedDiscs = new Set(listed.flatMap((file) => discFolderOf(file.path) ?? []));
  const isGoneForGood = (path: string): boolean => {
    const disc = discFolderOf(path);

    return (
      leftOut.has(path) ||
      (listedPaths.has(path) && !heldFilms.has(path)) ||
      laterParts.has(path) ||
      (disc !== null && listedDiscs.has(disc))
    );
  };
  const goneForNow = missing.filter((path) => !isGoneForGood(path));
  const replaced =
    store.setAside === undefined ? goneForNow : await store.setAside(libraryId, goneForNow, now);
  const newlyMissing =
    store.setAside === undefined
      ? []
      : goneForNow.filter(
          (path) =>
            !replaced.includes(path) && (storedByPath.get(path)?.missingSince ?? null) === null,
        );
  const expired =
    store.listMissingSince === undefined || isPartial || hasVanished
      ? []
      : (
          await store.listMissingSince(libraryId, new Date(now.getTime() - KEPT_MISSING_FOR_MS))
        ).filter((path) => !isUnderAny(path, walked.unreadable));
  const leaving = [...new Set([...missing.filter(isGoneForGood), ...replaced, ...expired])];
  const gone = leaving.length === 0 ? [] : await store.removeByPaths(libraryId, leaving);

  if (gone.length > 0) {
    onRemoved?.(gone);
  }

  await store.linkSameFilms?.(libraryId);

  await store.forgetEmptySeries?.(libraryId);

  await store.markScanned(libraryId);

  return {
    added,
    updated,
    removed: gone.length,
    failed,
    missing: newlyMissing.length,
    returned: returned.length,
  };
};

export type {
  MediaFileSystem,
  MediaRow,
  MediaStore,
  ScanPhase,
  ScanFindings,
  ScannedFile,
  ScannedItem,
  StoredItem,
  StoredPart,
  FilePart,
};

export { scanLibrary, selectChanged };
