import { askOfEntry } from '@ValenceClient/requests/askOfEntry';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * Which of the Catalogue's titles following everything follows: every film, series, artist and
 * album the libraries hold that nothing follows yet, each in a library that takes requests. An
 * album is left to its artist where the Catalogue lists the artist too, since following an artist
 * follows their albums.
 *
 * @param entries - Every title in the Catalogue.
 * @param takesRequests - The libraries that take requests, by id.
 * @returns The titles to follow, and how many more could be but sit in a library that takes none.
 */
const titlesToFollow = (
  entries: readonly CatalogueEntry[],
  takesRequests: ReadonlySet<string>,
): { titles: CatalogueEntry[]; elsewhere: number } => {
  const artists = new Set(
    entries
      .filter((entry) => entry.kind === 'artist')
      .map((entry) => entry.title.trim().toLowerCase()),
  );
  const followable = entries.filter(
    (entry) =>
      entry.status === 'notFollowed' &&
      entry.libraryId !== null &&
      askOfEntry(entry) !== null &&
      !(entry.kind === 'album' && artists.has((entry.subtitle ?? '').trim().toLowerCase())),
  );
  const titles = followable.filter(
    (entry) => entry.libraryId !== null && takesRequests.has(entry.libraryId),
  );

  return { titles, elsewhere: followable.length - titles.length };
};

export { titlesToFollow };
