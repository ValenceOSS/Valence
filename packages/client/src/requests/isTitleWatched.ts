import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Whether whoever is watching has seen a title to the end — a film in the library they finished.
 * A series is never taken as watched from here, since its standing names one episode of it and
 * that is not the whole of it.
 *
 * @param title - The title, as the catalogue offers it.
 * @param progress - How far this viewer is through everything, by item.
 * @returns Whether it is watched.
 */
const isTitleWatched = (
  title: CatalogueTitle,
  progress: ReadonlyMap<string, WatchProgress>,
): boolean =>
  title.kind === 'film' &&
  title.standing.status === 'library' &&
  title.standing.mediaId !== null &&
  progress.get(title.standing.mediaId)?.isFinished === true;

export { isTitleWatched };
