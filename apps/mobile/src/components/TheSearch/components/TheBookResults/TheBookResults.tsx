import { SearchX } from '@keyline-icons/react-native';
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheBookResultsProps } from './TheBookResults.types';

/**
 * The books whose title or author matches what was typed, across every book library, as the web's
 * search finds them — a shelf of their covers, each opening the book's page. Shown on their own, it
 * says so where nothing matches; shown beside films and music, it simply stays away.
 *
 * @param asked - What was typed.
 * @param isOnItsOwn - Whether books are all that is being looked for.
 * @param onBook - Told to open a book.
 */
const TheBookResultsSection = ({ asked, isOnItsOwn, onBook }: TheBookResultsProps) => {
  const colours = useTheColours();
  const found = useQuery(bookQueries.find({ search: asked }));
  const books = found.data ?? [];

  if (found.isPending) {
    return isOnItsOwn ? <ActivityIndicator color={colours.textMuted} /> : null;
  }

  if (books.length === 0) {
    return isOnItsOwn ? (
      <ANothingHere of={SearchX} title={`Nothing matches “${asked}”`} detail="Try fewer words." />
    ) : null;
  }

  return (
    <AShelf title="Books">
      {books.map((book) => (
        <Button
          key={book.id}
          tone="bare"
          label={book.title}
          onPress={() => {
            onBook(book.id);
          }}
        >
          <APoster
            title={book.title}
            year={book.year}
            artwork={book.hasCover ? onThisServer(bookCoverUrl(book.id)) : null}
            note={book.authors?.[0] ?? null}
          />
        </Button>
      ))}
    </AShelf>
  );
};

const TheBookResults = memo(TheBookResultsSection);

TheBookResults.displayName = 'TheBookResults';

export { TheBookResults };
