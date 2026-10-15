import { EXTRA_FOLDERS } from '@ValenceServer/library/naming/EXTRA_FOLDERS';
import { readEpisodes } from '@ValenceCore/releases/readEpisodes';
import { spacedName } from '@ValenceCore/releases/spacedName';
import { placeEpisodes } from './placeEpisodes';
import { placeFilms } from './placeFilms';
import type { Placement } from './Placement.types';

const MOST_VERSIONS = 3;

const NAMED_WITH_A_YEAR = /\((?:19|20)\d{2}\)\s*$/;

/**
 * Whether a folder at the top of an anime library is a film's: named with its year, as films are
 * filed, holding a few videos at most that number no episode, and no folders but extras.
 *
 * @param folder - The folder's name.
 * @param inside - Each file in it, by its path inside the folder.
 * @returns Whether it holds a film.
 */
const isFilmFolder = (folder: string, inside: readonly string[]): boolean => {
  const loose = inside.filter((path) => !path.includes('/'));
  const nested = inside.filter((path) => path.includes('/'));

  return (
    NAMED_WITH_A_YEAR.test(folder) &&
    loose.length > 0 &&
    loose.length <= MOST_VERSIONS &&
    nested.every((path) => EXTRA_FOLDERS.has((path.split('/')[0] ?? '').toLowerCase())) &&
    loose.every((path) => {
      const read = readEpisodes(spacedName(path.replace(/\.[^.]+$/, '')));

      return (
        read.seasons.length === 0 && read.absoluteEpisodes.length === 0 && read.airDate === null
      );
    })
  );
};

/**
 * Places the files of an anime library, which holds shows and their films side by side: a folder
 * at the top that holds a film, named with its year and numbering no episode, is placed as films
 * are, and everything else as a show's episodes.
 *
 * @param paths - Every file in it.
 * @param root - Its top folder.
 * @returns Where each file belongs.
 */
const placeAnime = (paths: readonly string[], root: string): Map<string, Placement> => {
  const top = `${root.replace(/\/+$/, '')}/`;
  const byFolder = new Map<string, string[]>();

  for (const path of paths) {
    const inside = path.startsWith(top) ? path.slice(top.length) : path;
    const slash = inside.indexOf('/');
    const folder = slash === -1 ? '' : inside.slice(0, slash);

    byFolder.set(folder, [...(byFolder.get(folder) ?? []), path]);
  }

  const films = [...byFolder].flatMap(([folder, held]) =>
    folder !== '' &&
    isFilmFolder(
      folder,
      held.map((path) => path.slice(top.length + folder.length + 1)),
    )
      ? held
      : [],
  );
  const filmed = new Set(films);

  return new Map([
    ...placeEpisodes(
      paths.filter((path) => !filmed.has(path)),
      root,
    ),
    ...placeFilms(films, root),
  ]);
};

export { placeAnime };
