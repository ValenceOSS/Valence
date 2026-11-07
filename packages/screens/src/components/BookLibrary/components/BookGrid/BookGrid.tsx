import { MediaCard } from '@ValenceUI/MediaCard';
import { VirtualGrid } from '@ValenceUI/VirtualGrid';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeOnShelf } from '@ValenceScreens/components/BookRow/describeOnShelf';
import { useCardOrigin } from '@ValenceScreens/linking/useCardOrigin';
import type { BookGridProps } from './BookGrid.types';

const CARD_WIDTHS = { small: 120, medium: 160, large: 210 } as const;

const CARD_CLASSES = { small: 'w-[120px]', medium: 'w-40', large: 'w-[210px]' } as const;

const COVER_TO_WIDTH = 1.5;

const UNDER_A_CARD = 72;

/**
 * Every book given, as a grid of covers that fills the width of the page, each under its year with
 * who wrote it beneath. Only the rows on screen are drawn, so a library of thousands scrolls as
 * smoothly as a shelf of ten.
 *
 * @param books - The books, in the order to show them.
 * @param label - What the grid holds, read out to anybody who cannot see it.
 * @param onOpen - Told which book was chosen.
 * @param size - How large the covers are drawn, as a viewer chose.
 */
const BookGrid = ({ books, label, onOpen, size = 'medium' }: BookGridProps) => {
  const cardOrigin = useCardOrigin();

  return (
    <VirtualGrid
      count={books.length}
      label={label}
      leastCardWidth={CARD_WIDTHS[size]}
      rowHeight={CARD_WIDTHS[size] * COVER_TO_WIDTH + UNDER_A_CARD}
    >
      {(at) => {
        const book = books[at];

        return book === undefined ? null : (
          <MediaCard
            key={book.id}
            title={book.title}
            shape="poster"
            imageUrl={bookCoverUrl(book.id)}
            {...cardOrigin(book.libraryId)}
            subtitle={describeOnShelf(book)}
            {...(book.year === null ? {} : { eyebrow: book.year.toString() })}
            onSelect={() => {
              onOpen(book);
            }}
            className={CARD_CLASSES[size]}
          />
        );
      }}
    </VirtualGrid>
  );
};

BookGrid.displayName = 'BookGrid';

export { BookGrid };
