import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { isMediaFile } from './readTitleFromPath';
import { resolveMetadata } from './MetadataProvider';
import { createFilenameMetadataProvider } from './createFilenameMetadataProvider';
import { describeQuality } from './describeQuality';
import { readEpisodeFromPath, tidy } from './readEpisodeFromPath';
import { nameOfFile } from './nameOfFile';
import { groupBareNumberedEpisodes } from './groupBareNumberedEpisodes';
import { groupExtras } from './groupExtras';
import { resolveSeriesFolders } from './resolveSeriesFolders';
import { titleOfSeriesFolder } from './titleOfSeriesFolder';
import { groupVersions } from './groupVersions';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import type { Metadata, MetadataProvider } from './MetadataProvider';
import type { EpisodeNumbering } from './readEpisodeFromPath';
import type { MediaProbe, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { ExtraKind, ScanResult } from '@ValenceContracts/schemas/Library';

type ScannedFile = {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
};

type ScanFindings = {
  files: ScannedFile[];
  unreadable: string[];
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
};

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
};

type MediaFileSystem = {
  listFiles: (root: string) => Promise<ScanFindings>;
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
  listOverrides?: (libraryId: string) => Promise<MediaOverride[]>;
  linkExtras?: (libraryId: string, links: { path: string; parentPath: string }[]) => Promise<void>;
  forgetStaleVersions?: (libraryId: string, stillVersions: string[]) => Promise<void>;
  regroupSeries?: (libraryId: string, foldersByPath: Map<string, string>) => Promise<void>;
  forgetEmptySeries?: (libraryId: string) => Promise<void>;
  markScanned: (libraryId: string) => Promise<void>;
};

type ScanLibraryOptions = {
  libraryId: string;
  root: string;
  within?: string;
  files: MediaFileSystem;
  store: MediaStore;
  transcoder: Transcoder;
  providers?: MetadataProvider[];
  force?: boolean;
  isPartial?: boolean;
  atOnce?: number;
  onProblem?: (path: string, reason: string) => void;
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
    const folder =
      seriesFolders.get(correction.path) ?? readEpisodeFromPath(correction.path).seriesFolder;

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
 * The season a numbered folder names, for a folder that sits inside a programme.
 *
 * `Some Show/01/` is the first season, which is how a ripped collection is usually laid out. Read
 * without knowing where the programme's own folder is, `24/` would be season twenty-four rather
 * than a programme called 24 — so this is only ever asked of a folder below one.
 *
 * @param path - The file being read.
 * @param seriesFolder - The folder of the programme it belongs to.
 * @returns The season the folder names, or null where it names none.
 */
const numericSeasonUnder = (path: string, seriesFolder: string | null): number | null => {
  const folder = path.slice(0, Math.max(0, path.lastIndexOf('/')));

  if (seriesFolder === null || !folder.startsWith(`${seriesFolder}/`)) {
    return null;
  }

  const name = folder.slice(folder.lastIndexOf('/') + 1);

  return /^\d{1,4}$/.test(name) ? Number(name) : null;
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
 * per file, so a library of twenty thousand that has gained two should cost two probes.
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

    return (
      existing === undefined ||
      existing.sizeBytes !== file.sizeBytes ||
      existing.modifiedAtMs !== file.modifiedAtMs ||
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
 * Walks a library root and brings the database in line with what is actually there: probing what is
 * new or changed, asking the metadata providers about each, and removing rows for files that have
 * gone. Reports its progress as it goes, since a first scan of a real library takes minutes.
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
  root,
  within = root,
  files,
  store,
  transcoder,
  providers = [createFilenameMetadataProvider()],
  force = false,
  isPartial = false,
  atOnce = 1,
  onProblem,
  onProgress,
  onAdded,
  onRemoved,
  isCancelled,
}: ScanLibraryOptions): Promise<ScanResult> => {
  const walked = await files.listFiles(within);
  const found = walked.files.filter((file) => isMediaFile(file.path));
  const stored = await store.listStored(libraryId);
  const probeVersion = await readProbeVersion(transcoder);

  const bareNumbered = groupBareNumberedEpisodes(found.map((file) => file.path));
  const extras = groupExtras(found.map((file) => file.path));
  const versions = groupVersions(
    found.map((file) => file.path),
    new Set([...extras.keys(), ...bareNumbered.keys()]),
  );

  const seen = force
    ? { changed: found, missing: selectChanged(found, stored, probeVersion).missing }
    : selectChanged(found, stored, probeVersion);
  const { changed } = seen;

  const hasVanished = found.length === 0 && stored.length > 0;
  const missing =
    isPartial || hasVanished
      ? []
      : seen.missing.filter((path) => !isUnderAny(path, walked.unreadable));
  const knownPaths = new Set(stored.map((item) => item.path));
  const storedByPath = new Map(stored.map((item) => [item.path, item]));
  const corrections = (await store.listOverrides?.(libraryId)) ?? [];
  const overrides = new Map(corrections.map((one) => [one.path, one]));
  const seriesFolders = resolveSeriesFolders({
    paths: [
      ...found.map((file) => file.path),
      ...stored.map((item) => item.path),
      ...corrections.map((one) => one.path),
    ],
    root,
  });
  const overridesBySeries = correctionsBySeries(corrections, seriesFolders);
  const catalogueBySeries = catalogueIdsBySeries(stored, seriesFolders);

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
      const probe = await transcoder.probe(file.path);

      if (probe.video === null) {
        failed += 1;
        onProblem?.(file.path, 'No video stream.');

        return false;
      }

      const read = readEpisodeFromPath(file.path);
      const bare = bareNumbered.get(file.path);
      const extra = extras.get(file.path) ?? null;

      const numbered =
        read.episodeNumber === null && bare !== undefined
          ? { ...read, ...bare, seriesYear: read.seriesYear }
          : read;

      const placed =
        extra?.seriesFolder === null || extra === null
          ? numbered
          : {
              ...numbered,
              seriesTitle: tidy(extra.seriesFolder.slice(extra.seriesFolder.lastIndexOf('/') + 1)),
              seriesFolder: extra.seriesFolder,
            };

      const belongsToSeries = placed.episodeNumber !== null || placed.seriesFolder !== null;
      const seriesFolder = belongsToSeries
        ? (seriesFolders.get(file.path) ?? placed.seriesFolder)
        : null;
      const fromFolder = seriesFolder === null ? null : titleOfSeriesFolder(seriesFolder);

      const episode = belongsToSeries
        ? {
            ...placed,
            seriesFolder,
            seriesTitle: fromFolder ?? placed.seriesTitle,
            seasonNumber: placed.seasonNumber ?? numericSeasonUnder(file.path, seriesFolder),
          }
        : placed;

      const corrected = correctionFor(
        file.path,
        episode.seriesFolder,
        overrides,
        overridesBySeries,
      );
      const knownExternalId =
        corrected?.externalId ??
        storedByPath.get(file.path)?.externalId ??
        (episode.episodeNumber === null || seriesFolder === null
          ? null
          : (catalogueBySeries.get(seriesFolder) ?? null));

      const metadata = await resolveMetadata(
        providers,
        {
          path: file.path,
          probe,
          episode,
          knownExternalId,
          ...(corrected === null ? {} : { knownExternalKind: corrected.externalKind }),
        },
        (name, reason) => onProblem?.(file.path, `Metadata provider ${name} failed: ${reason}`),
      );

      if (metadata === null) {
        failed += 1;
        onProblem?.(file.path, 'No metadata provider could name this file.');

        return false;
      }

      if (knownExternalId !== null && (metadata.externalId ?? null) === null) {
        failed += 1;
        onProblem?.(
          file.path,
          'The catalogue did not answer. Keeping what was already known about this file.',
        );

        return false;
      }

      const { title, year } = metadata;

      failedInARow = 0;

      const itemId = await store.upsert({
        libraryId,
        path: file.path,
        title,
        year,
        sizeBytes: file.sizeBytes,
        modifiedAtMs: file.modifiedAtMs,
        probe,
        probeVersion,
        metadata,
        episode,
        extraKind: extra?.kind ?? null,
        versionLabel: versions.get(file.path)?.label ?? null,
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
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
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
      onProblem?.(file.path, error instanceof Error ? describeFailure(error) : 'Probe failed.');

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
    onProblem?.(
      within,
      'Nothing was found where this library reads from, so what it already held has been left alone. Check the folder is still there — a network share that is not mounted looks exactly like an empty one.',
    );
  }

  if (hasGone) {
    onProblem?.(
      within,
      'The media service stopped answering, so this scan gave up rather than reporting the rest of the library as unreadable. Nothing was deleted, and the files it never reached are still waiting to be read.',
    );

    return { added, updated, removed: 0, failed };
  }

  if (isCancelled?.() === true) {
    onProblem?.(
      within,
      'This scan was stopped before it finished. What it had already read is kept; nothing was deleted, and the library still counts as unscanned.',
    );

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

  const gone = missing.length === 0 ? [] : await store.removeByPaths(libraryId, missing);

  if (gone.length > 0) {
    onRemoved?.(gone);
  }

  await store.forgetEmptySeries?.(libraryId);

  await store.markScanned(libraryId);

  return { added, updated, removed: gone.length, failed };
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
};

export { scanLibrary, selectChanged };
