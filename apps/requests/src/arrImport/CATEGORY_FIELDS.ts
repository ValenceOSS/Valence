import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const CATEGORY_FIELDS: Readonly<
  Record<FulfillingArrAppKind, { libraryKind: LibraryKind; field: string }>
> = {
  radarr: { libraryKind: 'movies', field: 'movieCategory' },
  sonarr: { libraryKind: 'shows', field: 'tvCategory' },
  lidarr: { libraryKind: 'music', field: 'musicCategory' },
};

export { CATEGORY_FIELDS };
