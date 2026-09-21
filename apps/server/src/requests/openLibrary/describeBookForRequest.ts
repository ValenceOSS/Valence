import { RequestCatalogueSchema } from '@ValenceContracts/schemas/MediaRequest';
import { describeOpenLibraryBook } from '@ValenceServer/requests/openLibrary/describeOpenLibraryBook';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * What Open Library says of a book, in the shape a request keeps of what was asked for: its title,
 * the year it was first published, what it is about, its cover, and who wrote it.
 *
 * A book has no release to wait for and no episodes, and is not going to change, so nothing more is
 * kept of it, and it is never followed for changes.
 *
 * @param web - The way out to the web.
 * @param openLibraryId - The number the work goes by.
 * @returns What it says, or null where Open Library does not know the work or could not be asked.
 */
const describeBookForRequest = async (
  web: MusicWeb,
  openLibraryId: number,
): Promise<RequestCatalogue | null> => {
  const found = await describeOpenLibraryBook(web, openLibraryId);

  return found === null
    ? null
    : RequestCatalogueSchema.parse({
        title: found.title,
        year: found.year,
        overview: found.overview,
        posterUrl: found.posterUrl,
        artist: found.authors[0] ?? null,
        isEnded: true,
      });
};

export { describeBookForRequest };
