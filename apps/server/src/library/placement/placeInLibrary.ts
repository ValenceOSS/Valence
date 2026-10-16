import { placeEpisodes } from './placeEpisodes';
import { placeFilms } from './placeFilms';
import { placeAnime } from './placeAnime';
import type { Placement } from './Placement.types';

/**
 * Places every file of a library by what kind of library it is, as Jellyfin does: a films library
 * holds only films and a programmes library only programmes, whatever a file happens to be called.
 * An anime library holds shows and their films side by side, each film in a folder of its own.
 *
 * @param kind - What the library holds.
 * @param paths - Every file in it.
 * @param root - Its top folder.
 * @returns Where each file belongs.
 */
const placeInLibrary = (
  kind: 'movies' | 'shows' | 'anime',
  paths: readonly string[],
  root: string,
): Map<string, Placement> =>
  kind === 'anime'
    ? placeAnime(paths, root)
    : kind === 'shows'
      ? placeEpisodes(paths, root)
      : placeFilms(paths, root);

export { placeInLibrary };
