import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownWideNarrow as SortIcon } from '@keyline-icons/react';
import { FilterBar } from '@ValenceUI/FilterBar';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { GridSizeChooser } from '@ValenceScreens/components/GridSizeChooser/GridSizeChooser';
import { readGridSize, saveGridSize } from '@ValenceScreens/library/gridSizePreference';
import { bookFilterGroups } from '@ValenceScreens/components/BookLibrary/bookFilterGroups';
import { booksPassing } from '@ValenceScreens/components/BookLibrary/booksPassing';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Rail } from '@ValenceUI/Rail';
import { Skeleton } from '@ValenceUI/Skeleton';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { SeriesDialog } from '@ValenceScreens/components/SeriesDialog/SeriesDialog';
import { BookGrid } from '@ValenceScreens/components/BookLibrary/components/BookGrid/BookGrid';
import type { BookSeries } from '@ValenceClient/books/gatherSeries';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookLibraryProps } from './BookLibrary.types';
import { say } from '@ValenceI18n/say';

const WAITING = 6;

const ON_A_SHELF = 20;

const MOST_GENRE_SHELVES = 5;

const FEWEST_FOR_A_GENRE_SHELF = 4;

const MOST_AUTHOR_SHELVES = 4;

const FEWEST_FOR_AN_AUTHOR_SHELF = 3;

const SORTS = ['title', 'author', 'added', 'newest'] as const;

type BookSort = (typeof SORTS)[number];

/**
 * The books in the order a sort asks for: by title or by the first author, A to Z, by when each was
 * added, newest first, or by the year each came out, newest first and the undated last.
 *
 * @param books - The books.
 * @param sort - The order.
 * @returns The books, sorted.
 */
const sortedBy = (books: readonly Book[], sort: BookSort): Book[] => {
  const byTitle = (one: Book, other: Book) => one.title.localeCompare(other.title);

  return [...books].sort((one, other) =>
    sort === 'author'
      ? (one.authors?.[0] ?? '￿').localeCompare(other.authors?.[0] ?? '￿') || byTitle(one, other)
      : sort === 'added'
        ? Date.parse(other.addedAt) - Date.parse(one.addedAt)
        : sort === 'newest'
          ? (other.year ?? -Infinity) - (one.year ?? -Infinity) || byTitle(one, other)
          : byTitle(one, other),
  );
};

/**
 * The genres a library has most books in, most first.
 *
 * @param books - The library's books.
 * @returns Each genre with how many books it holds.
 */
const genresOf = (books: readonly Book[]): { genre: string; count: number }[] => {
  const counts = new Map<string, number>();

  for (const genre of books.flatMap((book) => book.genres ?? [])) {
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }

  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((one, other) => other.count - one.count || one.genre.localeCompare(other.genre));
};

/**
 * One library of books under its name, laid out to be browsed: what came in most recently, its
 * series a card each, a shelf for each genre it holds most of, best rated first, a shelf for each
 * author it holds several books by, and then every book in it as a grid that can be put in order
 * by title, author, when it was added or when it came out, narrowed by genre, author, decade,
 * format and series with the same bar of filters the films have, and drawn at the size chosen. A series
 * shares one card on a shelf, which opens onto the series in order.
 *
 * @param libraryId - The library.
 * @param title - What the library is called.
 * @param onOpen - Told which book somebody wants to read.
 */
const BookLibrary = ({ libraryId, title, onOpen }: BookLibraryProps) => {
  const asked = useQuery(bookQueries.inLibrary(libraryId));
  const headingId = useId();
  const [openSeries, setOpenSeries] = useState<BookSeries | null>(null);
  const [sort, setSort] = useState<BookSort>('title');
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [size, setSize] = useState(readGridSize);
  const books = useMemo(() => asked.data ?? [], [asked.data]);
  const genres = useMemo(() => genresOf(books), [books]);
  const recent = useMemo(() => sortedBy(books, 'added').slice(0, ON_A_SHELF), [books]);
  const shelves = useMemo(
    () =>
      genres
        .filter((one) => one.count >= FEWEST_FOR_A_GENRE_SHELF)
        .slice(0, MOST_GENRE_SHELVES)
        .map((one) => ({
          genre: one.genre,
          books: books
            .filter((book) => book.genres?.includes(one.genre) === true)
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, ON_A_SHELF),
        })),
    [genres, books],
  );
  const inSeries = useMemo(
    () => books.filter((book) => book.series !== null && book.series !== undefined),
    [books],
  );
  const authorShelves = useMemo(() => {
    const counts = new Map<string, number>();

    for (const author of books.flatMap((book) => book.authors?.slice(0, 1) ?? [])) {
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }

    return [...counts]
      .filter(([, count]) => count >= FEWEST_FOR_AN_AUTHOR_SHELF)
      .sort((one, other) => other[1] - one[1] || one[0].localeCompare(other[0]))
      .slice(0, MOST_AUTHOR_SHELVES)
      .map(([author]) => ({
        author,
        books: sortedBy(
          books.filter((book) => book.authors?.[0] === author),
          'newest',
        ).slice(0, ON_A_SHELF),
      }));
  }, [books]);
  const filterGroups = useMemo(() => bookFilterGroups(books), [books]);
  const shown = useMemo(() => sortedBy(booksPassing(books, chosen), sort), [books, chosen, sort]);
  const sortNames: Record<BookSort, string> = {
    title: say('screens.bookLibrary.byTitle'),
    author: say('screens.bookLibrary.byAuthor'),
    added: say('screens.bookLibrary.byRecentlyAdded'),
    newest: say('screens.bookLibrary.byNewest'),
  };

  if (asked.isError) {
    return (
      <Rail title={title}>
        <CouldNotRead
          said={say('screens.bookRail.thatShelfCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </Rail>
    );
  }

  if (asked.data === undefined) {
    return (
      <Rail title={title}>
        {Array.from({ length: WAITING }, (_, at) => (
          <Skeleton key={at} className="aspect-[2/3] w-40 shrink-0" />
        ))}
      </Rail>
    );
  }

  if (books.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <h2 id={headingId} className="text-2xl font-semibold tracking-[-0.01em] text-text">
        {title}
      </h2>

      <BookRow
        title={say('common.recentlyAdded')}
        books={recent}
        onOpen={onOpen}
        onOpenSeries={setOpenSeries}
      />

      {inSeries.length === 0 ? null : (
        <BookRow
          title={say('common.series')}
          books={inSeries}
          onOpen={onOpen}
          onOpenSeries={setOpenSeries}
        />
      )}

      {shelves.map((shelf) => (
        <BookRow
          key={shelf.genre}
          title={shelf.genre}
          books={shelf.books}
          onOpen={onOpen}
          onOpenSeries={setOpenSeries}
        />
      ))}

      {authorShelves.map((shelf) => (
        <BookRow
          key={shelf.author}
          title={say('screens.bookLibrary.byAuthorName', { author: shelf.author })}
          books={shelf.books}
          onOpen={onOpen}
          onOpenSeries={setOpenSeries}
        />
      ))}

      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3">
          <h3 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-text">
            {say('screens.bookLibrary.allBooks')}
            <FormattedNumber value={shown.length} className="text-sm font-normal text-text-muted" />
          </h3>

          <div className="flex items-center gap-3">
            {filterGroups.length === 0 ? (
              <span className="flex-1" />
            ) : (
              <FilterBar
                label={say('screens.bookLibrary.filterTheBooksInName', { name: title })}
                groups={filterGroups}
                selected={chosen}
                onChange={setChosen}
                className="flex-1"
              />
            )}

            <div className={cn(JOINED_LOOKS.track, 'shrink-0')}>
              <OptionMenu
                label={say('screens.bookLibrary.sortBooks')}
                align="end"
                triggerShape="segment"
                trigger={
                  <>
                    <Icon of={SortIcon} size={16} />
                    {sortNames[sort]}
                  </>
                }
                groups={[
                  {
                    name: say('common.order'),
                    options: SORTS.map((one) => ({ id: one, label: sortNames[one] })),
                    selectedId: sort,
                    onSelect: (id) => {
                      const picked = SORTS.find((one) => one === id);

                      if (picked !== undefined) {
                        setSort(picked);
                      }
                    },
                  },
                ]}
              />
            </div>

            <GridSizeChooser
              className="shrink-0"
              value={size}
              onValueChange={(next) => {
                setSize(next);
                saveGridSize(next);
              }}
            />
          </div>
        </header>

        {shown.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            {say('screens.bookLibrary.nothingInThatGenre')}
          </p>
        ) : (
          <BookGrid
            books={shown}
            label={say('screens.bookLibrary.allBooks')}
            onOpen={onOpen}
            size={size}
          />
        )}
      </div>

      <SeriesDialog
        series={openSeries}
        onClose={() => {
          setOpenSeries(null);
        }}
        onOpen={(book) => {
          setOpenSeries(null);
          onOpen(book);
        }}
      />
    </section>
  );
};

BookLibrary.displayName = 'BookLibrary';

export { BookLibrary };
