import type { Book } from '@ValenceContracts/schemas/Book';
import { formatOf } from '@ValenceScreens/components/BookLibrary/formatOf';

/**
 * The books that pass the filters chosen: within one kind of filter any choice will do, and a book
 * must pass every kind chosen, so two genres and an author means either genre, by that author.
 *
 * @param books - The books.
 * @param chosen - The choices, each named `kind:value`.
 * @returns The books that pass.
 */
const booksPassing = (books: readonly Book[], chosen: ReadonlySet<string>): Book[] => {
  const byKind = new Map<string, Set<string>>();

  for (const choice of chosen) {
    const at = choice.indexOf(':');
    const kind = choice.slice(0, at);
    const values = byKind.get(kind) ?? new Set<string>();

    values.add(choice.slice(at + 1));
    byKind.set(kind, values);
  }

  return books.filter((book) =>
    [...byKind].every(([kind, values]) => {
      switch (kind) {
        case 'genre':
          return (book.genres ?? []).some((genre) => values.has(genre));
        case 'author':
          return (book.authors ?? []).some((author) => values.has(author));
        case 'decade':
          return book.year !== null && values.has((Math.floor(book.year / 10) * 10).toString());
        case 'format':
          return values.has(formatOf(book));
        case 'series':
          return values.has(book.series ? 'series' : 'standalone');
        default:
          return true;
      }
    }),
  );
};

export { booksPassing };
