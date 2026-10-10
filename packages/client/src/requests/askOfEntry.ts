import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What following a title nobody asked for asks for: the film, the series — every season, or the
 * ones named — the artist or the album, by the catalogue id it is known by, in the library that
 * already holds it, and as followed rather than asked for, so nobody is said to have asked. A book,
 * or a title known by no catalogue id, cannot be followed from here.
 *
 * @param entry - The title.
 * @param seasons - The seasons to follow, for a series; every one where none are named.
 * @returns What to ask for, or nothing where it cannot be.
 */
const askOfEntry = (
  entry: Pick<CatalogueEntry, 'kind' | 'catalogueId' | 'libraryId'>,
  seasons: number[] | null = null,
): MediaRequestAsk | null => {
  const { catalogueId } = entry;

  if (catalogueId === null) {
    return null;
  }

  const tmdbId = Number(catalogueId);
  const followed = {
    origin: 'monitored' as const,
    ...(entry.libraryId === null ? {} : { libraryId: entry.libraryId }),
  };

  switch (entry.kind) {
    case 'film':
      return Number.isInteger(tmdbId) && tmdbId > 0 ? { kind: 'film', tmdbId, ...followed } : null;
    case 'series':
      return Number.isInteger(tmdbId) && tmdbId > 0
        ? { kind: 'series', tmdbId, seasons, ...followed }
        : null;
    case 'artist':
    case 'album':
      return { kind: entry.kind, musicBrainzId: catalogueId, ...followed };
    case 'book':
      return null;
  }
};

export { askOfEntry };
