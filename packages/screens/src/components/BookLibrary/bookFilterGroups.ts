import type { Book } from '@ValenceContracts/schemas/Book';
import { formatOf } from '@ValenceScreens/components/BookLibrary/formatOf';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import { say } from '@ValenceI18n/say';

/**
 * The filters a library of books can be narrowed by, each offering only what its books have: their
 * genres and authors, most common first, the decades they came out in, newest first, their formats,
 * and whether they are part of a series. A filter with fewer than two choices is left out, since it
 * could not narrow anything.
 *
 * @param books - The library's books.
 * @returns The filters, each choice named `kind:value`.
 */
const bookFilterGroups = (books: readonly Book[]): FilterGroup[] => {
  const counted = (values: readonly string[]) => {
    const counts = new Map<string, number>();

    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return [...counts].sort((one, other) => other[1] - one[1] || one[0].localeCompare(other[0]));
  };
  const decades = [
    ...new Set(
      books.flatMap((book) => (book.year === null ? [] : [Math.floor(book.year / 10) * 10])),
    ),
  ].sort((one, other) => other - one);
  const formats = [...new Set(books.map(formatOf))];
  const series = new Set<string>(books.map((book) => (book.series ? 'series' : 'standalone')));
  const formatNames = {
    ebook: say('common.ebook'),
    audiobook: say('common.audiobook'),
    comic: say('screens.bookLibrary.comic'),
  };
  const groups: FilterGroup[] = [
    {
      name: say('common.genre'),
      options: counted(books.flatMap((book) => book.genres ?? [])).map(([genre]) => ({
        id: `genre:${genre}`,
        label: genre,
      })),
    },
    {
      name: say('screens.bookLibrary.author'),
      options: counted(books.flatMap((book) => book.authors ?? [])).map(([author]) => ({
        id: `author:${author}`,
        label: author,
      })),
    },
    {
      name: say('common.decade'),
      options: decades.map((decade) => ({
        id: `decade:${decade.toString()}`,
        label: say('client.library.buildFilterOptions.decadeS', { decade: decade.toString() }),
      })),
    },
    {
      name: say('screens.adminArea.webhookFields.shape'),
      options: formats.map((format) => ({ id: `format:${format}`, label: formatNames[format] })),
    },
    {
      name: say('common.series'),
      isSingle: true,
      options: [
        { id: 'series:series', label: say('screens.bookLibrary.inASeries') },
        { id: 'series:standalone', label: say('screens.bookLibrary.standalone') },
      ].filter((option) => series.has(option.id.slice('series:'.length))),
    },
  ];

  return groups.filter((group) => group.options.length > 1);
};

export { bookFilterGroups };
