import { EXTRA_FOLDERS } from '@ValenceServer/library/naming/EXTRA_FOLDERS';
import { parseEpisodePath } from '@ValenceServer/library/naming/parseEpisodePath';
import { parseName } from '@ValenceServer/library/naming/parseName';
import { spaceOutName } from '@ValenceServer/library/naming/spaceOutName';
import { parseSeasonFolder } from '@ValenceServer/library/naming/parseSeasonFolder';
import { readAttribute } from '@ValenceServer/library/naming/readAttribute';
import { readExtraKind } from '@ValenceServer/library/naming/readExtraKind';
import { resolveEpisode } from '@ValenceServer/library/naming/resolveEpisode';
import { resolveSeriesName } from '@ValenceServer/library/naming/resolveSeriesName';
import { NOT_AN_EPISODE } from './NOT_AN_EPISODE';
import { NO_IDS } from './NO_IDS';
import { inVersionOrder } from './inVersionOrder';
import { isOrdinaryPath } from './isOrdinaryPath';
import { labelOfVersion } from './labelOfVersion';
import { pathParts } from './pathParts';
import { readEpisodeTitle } from './readEpisodeTitle';
import type { Placement } from './Placement.types';

const ID_TAG = /\s*[[({](?:tmdb|tvdb|imdb)(?:id)?[=-][^\])}]*[\])}]/giu;

const EXTRA_SUFFIX =
  /(?:[-._ ](?:trailer|sample)|- (?:trailer|sample)|-(?:scene|clip|interview|behindthescenes|deleted|deletedscene|featurette|short|extra|other))$/iu;

/**
 * The season a folder directly inside a programme stands for, the way Jellyfin reads one: a named
 * or numbered season folder gives its number, a folder named like an episode is no season at all,
 * and any other folder is a season whose number is not known.
 *
 * @param folder - The folder inside the programme.
 * @param seriesFolder - The programme's folder.
 * @returns Whether it is a season, and its number where it gives one.
 */
const readSeason = (
  folder: string,
  seriesFolder: string,
): { isSeason: boolean; seasonNumber: number | null } => {
  const read = parseSeasonFolder(folder, seriesFolder, true, true);

  if (read.isSeasonFolder) {
    return { isSeason: true, seasonNumber: read.seasonNumber };
  }

  const likeAnEpisode = resolveEpisode(`/test/${folder.slice(folder.lastIndexOf('/') + 1)}`, {
    isDirectory: true,
  });

  return likeAnEpisode?.episodeNumber !== null &&
    likeAnEpisode?.episodeNumber !== undefined &&
    likeAnEpisode.seasonNumber !== null
    ? { isSeason: false, seasonNumber: null }
    : { isSeason: true, seasonNumber: read.seasonNumber };
};

/**
 * The key two files in one folder share when they are the same episode, from the rules that do not
 * guess — its season and number, or its air date.
 *
 * @param path - The file.
 * @returns The key, or null where the file does not plainly name an episode.
 */
const episodeKeyOf = (path: string): string | null => {
  const read = parseEpisodePath(path, { isOptimistic: false, fillExtendedInfo: false });

  if (!read.isSuccess) {
    return null;
  }

  if (read.isByDate) {
    return read.year === null
      ? null
      : `D${String(read.year)}-${String(read.month)}-${String(read.day)}`;
  }

  return read.seasonNumber === null || read.episodeNumber === null
    ? null
    : // eslint-disable-next-line valence/no-hard-coded-strings -- a key episodes are grouped by
      `S${String(read.seasonNumber)}E${String(read.episodeNumber)}`;
};

/**
 * The start two names share, which is what the versions of one episode are told apart after.
 *
 * @param left - One name.
 * @param right - The other.
 * @returns What they both start with.
 */
const sharedStart = (left: string, right: string): string => {
  let at = 0;

  while (
    at < left.length &&
    at < right.length &&
    left[at]?.toLowerCase() === right[at]?.toLowerCase()
  ) {
    at += 1;
  }

  return left.slice(0, at);
};

/**
 * Places every file of a programmes library the way Jellyfin does: the first folder under the
 * library is the programme, a folder inside it is a season, and every video in it is an episode of
 * that programme whatever the file is called — its season and number read from its name with
 * Jellyfin's rules, falling back to its season folder, and to the first season where there is no
 * season folder at all. A file lying loose at the top of the library is read by its name alone.
 *
 * @param paths - Every file in the library.
 * @param root - The library's top folder.
 * @returns Where each file belongs.
 */
const placeEpisodes = (paths: readonly string[], root: string): Map<string, Placement> => {
  const base = root.replace(/\/+$/, '');
  const placed = new Map<string, Placement>();
  const kept = paths.filter((path) => isOrdinaryPath(path, base));
  const keptPaths = new Set(kept);
  const episodes: string[] = [];

  for (const path of paths) {
    if (!keptPaths.has(path)) {
      placed.set(path, {
        isIgnored: true,
        title: pathParts(path).stem,
        year: null,
        episode: NOT_AN_EPISODE,
        ids: NO_IDS,
        nfoPaths: [],
        extra: null,
        version: null,
      });
    }
  }

  const seriesFolderOf = (path: string): string | null => {
    const below = path.startsWith(`${base}/`) ? path.slice(base.length + 1).split('/') : [];

    return below.length >= 2 ? `${base}/${below[0] ?? ''}` : null;
  };

  for (const path of kept) {
    const kind = readExtraKind(path, base);

    if (kind === null) {
      episodes.push(path);
    }
  }

  for (const path of episodes) {
    const { folder, stem } = pathParts(path);
    const seriesFolder = seriesFolderOf(path);
    const below = seriesFolder === null ? [] : folder.slice(seriesFolder.length + 1).split('/');
    const seasonFolder =
      seriesFolder === null || folder === seriesFolder ? null : `${seriesFolder}/${below[0] ?? ''}`;
    const season =
      seriesFolder === null || seasonFolder === null
        ? { isSeason: false, seasonNumber: null }
        : readSeason(seasonFolder, seriesFolder);
    const fromFile = resolveEpisode(path);
    const read =
      fromFile ??
      (folder !== seriesFolder && folder !== seasonFolder && folder !== base
        ? resolveEpisode(folder, { isDirectory: true })
        : null);
    const episodeNumber = read?.episodeNumber ?? null;
    const seasonNumber =
      read?.seasonNumber ??
      (season.isSeason ? season.seasonNumber : null) ??
      (!season.isSeason && (episodeNumber !== null || read?.isByDate === true) ? 1 : null);
    const series =
      seriesFolder === null
        ? { name: read?.seriesName ?? null, year: null }
        : resolveSeriesName(seriesFolder);
    const seriesName =
      series.name === null || series.name === ''
        ? null
        : seriesFolder === null
          ? spaceOutName(parseName(series.name).name)
          : series.name.replace(ID_TAG, '').trim();
    const seriesFolderName = seriesFolder?.slice(seriesFolder.lastIndexOf('/') + 1) ?? '';
    const fromName = parseName(stem);

    placed.set(path, {
      isIgnored: false,
      title: spaceOutName(fromName.name === '' ? stem : fromName.name),
      year: series.year,
      episode: {
        seriesTitle: seriesName,
        seriesYear: series.year,
        seriesFolder,
        seasonNumber,
        episodeNumber,
        episodeNumberEnd: episodeNumber === null ? null : (read?.endingEpisodeNumber ?? null),
        episodeTitle:
          readEpisodeTitle(stem) ?? (fromName.name === '' ? null : spaceOutName(fromName.name)),
      },
      ids:
        seriesFolder === null
          ? NO_IDS
          : {
              tmdb: readAttribute(seriesFolderName, 'tmdbid'),
              tvdb: readAttribute(seriesFolderName, 'tvdbid'),
              imdb: readAttribute(seriesFolderName, 'imdbid'),
            },
      nfoPaths: seriesFolder === null ? [] : [`${seriesFolder}/tvshow.nfo`],
      extra: null,
      version: null,
    });
  }

  const byFolder = new Map<string, string[]>();

  for (const path of episodes) {
    const { folder } = pathParts(path);

    byFolder.set(folder, [...(byFolder.get(folder) ?? []), path]);
  }

  for (const held of byFolder.values()) {
    const byKey = new Map<string, string[]>();

    for (const path of held) {
      const key = episodeKeyOf(path);

      if (key !== null) {
        byKey.set(key.toLowerCase(), [...(byKey.get(key.toLowerCase()) ?? []), path]);
      }
    }

    for (const same of byKey.values()) {
      if (same.length < 2) {
        continue;
      }

      const [primary, ...others] = inVersionOrder(same);
      const shared = pathParts(primary ?? '').stem;

      for (const other of others) {
        const known = placed.get(other);

        if (known !== undefined && primary !== undefined) {
          placed.set(other, {
            ...known,
            version: {
              parentPath: primary,
              label: labelOfVersion(other, sharedStart(shared, pathParts(other).stem)),
            },
          });
        }
      }
    }
  }

  for (const path of kept) {
    const kind = readExtraKind(path, base);

    if (kind === null) {
      continue;
    }

    const { folder, stem } = pathParts(path);
    const folderName = folder.slice(folder.lastIndexOf('/') + 1).toLowerCase();
    const seriesFolder = seriesFolderOf(path);
    const named = stem
      .replace(/[0-9]+$/, '')
      .replace(EXTRA_SUFFIX, '')
      .toLowerCase();
    const sibling = EXTRA_FOLDERS.has(folderName)
      ? null
      : ((byFolder.get(folder) ?? []).find(
          (episode) => pathParts(episode).stem.toLowerCase() === named,
        ) ?? null);
    const fromName = parseName(stem);
    const owner = sibling === null ? seriesFolder : null;
    const ownerName = owner === null ? null : resolveSeriesName(owner);

    placed.set(path, {
      isIgnored: false,
      title: spaceOutName(fromName.name === '' ? stem : fromName.name),
      year: fromName.year,
      episode:
        ownerName === null
          ? NOT_AN_EPISODE
          : {
              ...NOT_AN_EPISODE,
              seriesTitle: ownerName.name.replace(ID_TAG, '').trim(),
              seriesYear: ownerName.year,
              seriesFolder: owner,
            },
      ids: NO_IDS,
      nfoPaths: [],
      extra: {
        kind,
        parentPath: sibling,
        seriesFolder: owner,
      },
      version: null,
    });
  }

  return placed;
};

export { placeEpisodes };
