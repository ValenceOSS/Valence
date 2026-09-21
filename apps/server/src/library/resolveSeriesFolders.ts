import { isMediaFile } from './readTitleFromPath';
import { readEpisodeFromPath } from './readEpisodeFromPath';
import { readSeasonDirectory } from './readSeasonDirectory';

const NUMERIC_SEASON = /^\d{1,4}$/;

type SeriesFolderOptions = {
  paths: readonly string[];
  root: string;
};

/**
 * Drops any trailing slash, so that a root given as `/media/shows/` and one given as
 * `/media/shows` describe the same directory.
 *
 * @param path - The path to tidy.
 * @returns It without a trailing slash.
 */
const withoutTrailingSlash = (path: string): string =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

/**
 * The directory holding a file.
 *
 * @param path - The file's full path.
 * @returns The directory above it.
 */
const folderOf = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');

  return lastSlash <= 0 ? '' : path.slice(0, lastSlash);
};

/**
 * The directories between a library's root and a file, from the one directly inside the root down
 * to the one holding the file.
 *
 * A file sitting in the root itself is inside no directory at all, which is what tells a loose
 * episode apart from one filed under a programme.
 *
 * @param folder - The directory holding the file.
 * @param root - The library's root directory.
 * @returns Each directory under the root, shallowest first.
 */
const chainUnder = (folder: string, root: string): string[] => {
  if (folder === root || !folder.startsWith(`${root}/`)) {
    return [];
  }

  const chain: string[] = [];
  const segments = folder.slice(root.length + 1).split('/');

  let walked = root;

  for (const segment of segments) {
    walked = `${walked}/${segment}`;

    chain.push(walked);
  }

  return chain;
};

/**
 * Works out which folder holds each programme, which is what decides where an episode belongs.
 *
 * A programme is a folder, the way a person filing one would say it: everything under
 * `Curb Your Enthusiasm` is that programme, whether it sits in a season folder, in `Specials`, or
 * loose in the folder itself. Nothing below that folder may start a programme of its own, which is
 * what stops a `Deleted Scenes` folder becoming a show on the shelf beside the one it belongs to.
 *
 * A folder is read as a programme's when it holds an episode directly, or when it holds a folder
 * naming a season. Both matter: a programme with its episodes loose in one folder says so by the
 * episodes, and one whose folder holds nothing but `Season 1` says so by the season. Reading only
 * the first directory under the root would have merged a library filed by studio — everything under
 * `Marvel` becoming one programme — so the search walks down until it finds the folder that is
 * actually a programme rather than a drawer holding several.
 *
 * A folder named nothing but a number counts as a season, but only ever as somebody's child. `01`
 * inside a programme is its first season, while `24` sitting in the library's root is a programme
 * called 24 — and the difference is which of the two the folder is, not what it is called.
 *
 * A file lying directly in the library's root belongs to no folder, and is left to be named by what
 * the file itself says. That is the flat library, where every episode of every programme sits in one
 * directory, and there the filename is the only thing that tells them apart.
 *
 * @param paths - Every file in the library.
 * @param root - The library's root directory.
 * @returns The folder of the programme each file belongs to, for the files that are under one.
 */
const resolveSeriesFolders = ({ paths, root }: SeriesFolderOptions): Map<string, string> => {
  const base = withoutTrailingSlash(root);
  const episodesIn = new Set<string>();
  const seasonHolders = new Set<string>();

  for (const path of paths) {
    const folder = folderOf(path);

    if (isMediaFile(path) && readEpisodeFromPath(path).episodeNumber !== null) {
      episodesIn.add(folder);
    }

    for (const directory of chainUnder(folder, base)) {
      const above = folderOf(directory);
      const name = directory.slice(directory.lastIndexOf('/') + 1);

      if (readSeasonDirectory(name) !== null || NUMERIC_SEASON.test(name)) {
        seasonHolders.add(above);
      }
    }
  }

  const folders = new Map<string, string>();

  for (const path of paths) {
    const chain = chainUnder(folderOf(path), base);

    if (chain.length === 0) {
      continue;
    }

    const found = chain.find(
      (directory) => episodesIn.has(directory) || seasonHolders.has(directory),
    );

    folders.set(path, found ?? chain[0] ?? base);
  }

  return folders;
};

export type { SeriesFolderOptions };

export { resolveSeriesFolders };
