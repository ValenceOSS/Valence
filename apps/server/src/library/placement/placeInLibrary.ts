import { placeEpisodes } from './placeEpisodes';
import { placeFilms } from './placeFilms';
import type { Placement } from './Placement.types';

/**
 * Places every file of a library by what kind of library it is, as Jellyfin does: a films library
 * holds only films and a programmes library only programmes, whatever a file happens to be called.
 *
 * @param kind - What the library holds.
 * @param paths - Every file in it.
 * @param root - Its top folder.
 * @returns Where each file belongs.
 */
const placeInLibrary = (
  kind: 'movies' | 'shows',
  paths: readonly string[],
  root: string,
): Map<string, Placement> =>
  kind === 'shows' ? placeEpisodes(paths, root) : placeFilms(paths, root);

export { placeInLibrary };
