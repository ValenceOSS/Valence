import { placeEpisodes } from './placeEpisodes';
import { placeFilms } from './placeFilms';
import { placeAnime } from './placeAnime';
import { placedThroughDiscs } from './placedThroughDiscs';
import type { Placement } from './Placement.types';

/**
 * Places every file of a library by what kind of library it is, as Jellyfin does: a films library
 * holds only films and a programmes library only programmes, whatever a file happens to be called.
 * An anime library holds shows and their films side by side, each film in a folder of its own.
 *
 * @param kind - What the library holds.
 * @param paths - Every file in it.
 * @param root - Its top folder.
 * @param unjoined - The first parts of films kept as several files whose parts cannot be read as
 *   one, which are placed as copies of one film instead.
 * @returns Where each file belongs.
 */
const placeInLibrary = (
  kind: 'movies' | 'shows' | 'anime',
  paths: readonly string[],
  root: string,
  unjoined: ReadonlySet<string> = new Set(),
): Map<string, Placement> =>
  kind === 'anime'
    ? placedThroughDiscs(placeAnime, paths, root)
    : kind === 'shows'
      ? placedThroughDiscs(placeEpisodes, paths, root)
      : placeFilms(paths, root, unjoined);

export { placeInLibrary };
