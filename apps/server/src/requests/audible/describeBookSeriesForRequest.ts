import { RequestCatalogueSchema } from '@ValenceContracts/schemas/MediaRequest';
import { readAudibleSeries } from '@ValenceServer/requests/audible/readAudibleSeries';
import { searchOpenLibrary } from '@ValenceServer/requests/openLibrary/searchOpenLibrary';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * Words of a title, lower case and without punctuation or what comes after a colon, for telling
 * whether two catalogues name the same book.
 *
 * @param title - The title.
 * @returns Its words.
 */
const wordsOf = (title: string): string =>
  (title.split(':')[0] ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * What a book series is, in the shape a request keeps: its name, its author, and each of its books
 * in order as Audible sells them, each found on Open Library by its title and author, which is how
 * a book is asked for; a book Open Library does not know is kept, and can't be fetched on its own.
 *
 * @param web - The way out to the web.
 * @param seriesAsin - The series' Audible id.
 * @returns What it says, or null where Audible does not know the series.
 */
const describeBookSeriesForRequest = async (
  web: MusicWeb,
  seriesAsin: string,
): Promise<RequestCatalogue | null> => {
  const series = await readAudibleSeries(web, seriesAsin);

  if (series === null || series.books.length === 0) {
    return null;
  }

  const books = [];

  for (const book of series.books) {
    const found = await searchOpenLibrary(
      web,
      book.author === null ? book.title : `${book.title} ${book.author}`,
    );
    const match = found.find((one) => wordsOf(one.title) === wordsOf(book.title));

    books.push({
      ...book,
      openLibraryId: match?.openLibraryId ?? null,
      coverUrl: match?.coverUrl ?? null,
    });
  }

  const [first] = books;

  return RequestCatalogueSchema.parse({
    title: series.title,
    year: books.flatMap((book) => (book.year === null ? [] : [book.year])).toSorted()[0] ?? null,
    artist: first?.author ?? null,
    isEnded: false,
    books,
  });
};

export { describeBookSeriesForRequest };
