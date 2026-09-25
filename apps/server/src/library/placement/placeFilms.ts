import { EXTRA_FOLDERS } from '@ValenceServer/library/naming/EXTRA_FOLDERS';
import { cleanDateTime } from '@ValenceServer/library/naming/cleanDateTime';
import { isEligibleForMultiVersion } from '@ValenceServer/library/naming/isEligibleForMultiVersion';
import { parseName } from '@ValenceServer/library/naming/parseName';
import { spaceOutName } from '@ValenceServer/library/naming/spaceOutName';
import { readAttribute } from '@ValenceServer/library/naming/readAttribute';
import { readExtraKind } from '@ValenceServer/library/naming/readExtraKind';
import { NOT_AN_EPISODE } from './NOT_AN_EPISODE';
import { NO_IDS } from './NO_IDS';
import { inVersionOrder } from './inVersionOrder';
import { isOrdinaryPath } from './isOrdinaryPath';
import { labelOfVersion } from './labelOfVersion';
import { pathParts } from './pathParts';
import type { Placement } from './Placement.types';

const SAMPLE = /\bsample\b/iu;

const EXTRA_SUFFIX =
  /(?:[-._ ](?:trailer|sample)|- (?:trailer|sample)|-(?:scene|clip|interview|behindthescenes|deleted|deletedscene|featurette|short|extra|other))$/iu;

type Folder = {
  films: string[];
  versions: Map<string, string>;
  namesFilm: boolean;
};

/**
 * Decides which files in one folder are films and which are versions of one, and whether the folder
 * names the film it holds, by Jellyfin's rules: files are versions of one film where every one of
 * them starts with the folder's name, says nothing after it but a label, and gives the same year;
 * and a folder names its film where it holds that one film and no folders of other films.
 *
 * @param folder - The folder.
 * @param plain - The films and versions in it, extras left out.
 * @param root - The library's top folder.
 * @param holdsOthers - Whether it has folders of other films inside it.
 * @returns What the folder holds.
 */
const readFolder = (
  folder: string,
  plain: readonly string[],
  root: string,
  holdsOthers: boolean,
): Folder => {
  const folderName = folder.slice(folder.lastIndexOf('/') + 1);
  const years = new Set(plain.map((path) => cleanDateTime(pathParts(path).stem).year ?? -1));
  const areVersions =
    folder !== root &&
    folderName.length > 1 &&
    plain.length > 1 &&
    years.size === 1 &&
    plain.every((path) => isEligibleForMultiVersion(folderName, pathParts(path).stem));

  if (!areVersions) {
    return {
      films: [...plain],
      versions: new Map(),
      namesFilm: folder !== root && plain.length === 1 && !holdsOthers,
    };
  }

  const ordered = inVersionOrder(plain);
  const primary = ordered.find((path) => pathParts(path).stem === folderName) ?? ordered[0] ?? '';

  return {
    films: [primary],
    versions: new Map(ordered.filter((path) => path !== primary).map((path) => [path, primary])),
    namesFilm: !holdsOthers,
  };
};

/**
 * Places every file of a films library the way Jellyfin does: each video is a film, named by its
 * folder where the folder holds just that film and by its own name where it shares a folder with
 * others, with versions, extras, sample files and identifiers written into the names read the same
 * way Jellyfin reads them.
 *
 * @param paths - Every file in the library.
 * @param root - The library's top folder.
 * @returns Where each file belongs.
 */
const placeFilms = (paths: readonly string[], root: string): Map<string, Placement> => {
  const base = root.replace(/\/+$/, '');
  const placed = new Map<string, Placement>();
  const kept = paths.filter(
    (path) => isOrdinaryPath(path, base) && !SAMPLE.test(pathParts(path).fileName),
  );
  const byFolder = new Map<string, string[]>();
  const holdsOthers = new Set<string>();

  for (const path of kept) {
    const { folder } = pathParts(path);

    byFolder.set(folder, [...(byFolder.get(folder) ?? []), path]);

    for (let above = folder; above.startsWith(`${base}/`);) {
      const parent = above.slice(0, above.lastIndexOf('/'));
      const child = above.slice(above.lastIndexOf('/') + 1).toLowerCase();

      if (!EXTRA_FOLDERS.has(child)) {
        holdsOthers.add(parent);
      }

      above = parent;
    }
  }

  const folders = new Map<string, Folder>();

  for (const [folder, held] of byFolder) {
    const plain = held.filter((path) => readExtraKind(path, base) === null);

    folders.set(folder, readFolder(folder, plain, base, holdsOthers.has(folder)));
  }

  const describeFilm = (path: string, folder: string, namesFilm: boolean): Placement => {
    const { fileName, stem } = pathParts(path);
    const folderName = folder.slice(folder.lastIndexOf('/') + 1);
    const fromFile = parseName(stem);
    const fromFolder = parseName(folderName);
    const named = namesFilm ? fromFolder : fromFile;

    return {
      isIgnored: false,
      title: spaceOutName(named.name === '' ? stem : named.name),
      year: namesFilm ? (fromFile.year ?? fromFolder.year) : fromFile.year,
      episode: NOT_AN_EPISODE,
      ids: {
        tmdb:
          (namesFilm ? readAttribute(folderName, 'tmdbid') : null) ??
          readAttribute(fileName, 'tmdbid'),
        tvdb:
          (namesFilm ? readAttribute(folderName, 'tvdbid') : null) ??
          readAttribute(fileName, 'tvdbid'),
        imdb: readAttribute(path, 'imdbid'),
      },
      nfoPaths: [
        ...(namesFilm ? [`${folder}/movie.nfo`] : []),
        `${path.slice(0, path.length - fileName.length)}${stem}.nfo`,
      ],
      extra: null,
      version: null,
    };
  };

  for (const [folder, read] of folders) {
    const folderName = folder.slice(folder.lastIndexOf('/') + 1);

    for (const film of read.films) {
      placed.set(film, describeFilm(film, folder, read.namesFilm));
    }

    for (const [version, primary] of read.versions) {
      placed.set(version, {
        ...describeFilm(version, folder, read.namesFilm),
        version: { parentPath: primary, label: labelOfVersion(version, folderName) },
      });
    }
  }

  for (const path of kept) {
    const kind = readExtraKind(path, base);

    if (kind === null) {
      continue;
    }

    const { folder, stem } = pathParts(path);
    const folderName = folder.slice(folder.lastIndexOf('/') + 1).toLowerCase();
    const isInExtrasFolder = EXTRA_FOLDERS.has(folderName) && folder !== base;
    const ownerFolder = isInExtrasFolder ? folder.slice(0, folder.lastIndexOf('/')) : folder;
    const owners = folders.get(ownerFolder)?.films ?? [];
    const named = stem
      .replace(/[0-9]+$/, '')
      .replace(EXTRA_SUFFIX, '')
      .toLowerCase();
    const owner =
      owners.length === 1
        ? (owners[0] ?? null)
        : (owners.find((film) => pathParts(film).stem.toLowerCase() === named) ?? null);
    const fromName = parseName(stem);

    placed.set(path, {
      isIgnored: false,
      title: spaceOutName(fromName.name === '' ? stem : fromName.name),
      year: fromName.year,
      episode: NOT_AN_EPISODE,
      ids: NO_IDS,
      nfoPaths: [],
      extra: { kind, parentPath: owner, seriesFolder: null },
      version: null,
    });
  }

  for (const path of paths) {
    if (!placed.has(path)) {
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

  return placed;
};

export { placeFilms };
