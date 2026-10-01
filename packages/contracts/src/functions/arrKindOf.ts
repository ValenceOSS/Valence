import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const ARR_KINDS: Readonly<Record<LibraryKind, FulfillingArrAppKind | null>> = {
  movies: 'radarr',
  shows: 'sonarr',
  music: 'lidarr',
  books: null,
};

/**
 * Which kind of connected app can fulfil requests for a kind of library: Radarr for films, Sonarr
 * for series and Lidarr for music. Books have none, and are always Valence's own.
 *
 * @param kind - The kind of library.
 * @returns The kind of app, or null where none can.
 */
const arrKindOf = (kind: LibraryKind): FulfillingArrAppKind | null => ARR_KINDS[kind];

export { arrKindOf };
