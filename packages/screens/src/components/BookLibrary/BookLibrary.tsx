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
import { BookGrid } from '@ValenceScreens/components/BookLibrary/components/BookGrid/BookGrid';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookLibraryProps } from './BookLibrary.types';
import { say } from '@ValenceI18n/say';

const WAITING = 6;

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
 * One library of books, every book in it as a grid that can be put in order by title, author, when
 * it was added or when it came out, narrowed by genre, author, decade, format and series with the
 * same bar of filters the films have, and drawn at the size chosen.
 *
 * @param libraryId - The library.
 * @param title - What the library is called.
 * @param onOpen - Told which book somebody wants to read.
 */
const BookLibrary = ({ libraryId, title, onOpen }: BookLibraryProps) => {
  const asked = useQuery(bookQueries.inLibrary(libraryId));
  const headingId = useId();
  const [sort, setSort] = useState<BookSort>('title');
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [size, setSize] = useState(readGridSize);
  const books = useMemo(() => asked.data ?? [], [asked.data]);
  const filterGroups = useMemo(() => bookFilterGroups(books), [books]);
  const shown = useMemo(() => sortedBy(booksPassing(books, chosen), sort), [books, chosen, sort]);
  const sortNames: Record<BookSort, string> = {
    title: say('common.title'),
    author: say('screens.bookLibrary.author'),
    added: say('common.recentlyAdded'),
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
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3">
          <h2
            id={headingId}
            className="flex items-baseline gap-2 text-2xl font-semibold tracking-[-0.01em] text-text"
          >
            {say('phone.theLibrary.theBooks.everyBook')}
            <FormattedNumber value={shown.length} className="text-sm font-normal text-text-muted" />
          </h2>

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
            label={say('phone.theLibrary.theBooks.everyBook')}
            onOpen={onOpen}
            size={size}
          />
        )}
      </div>
    </section>
  );
};

BookLibrary.displayName = 'BookLibrary';

export { BookLibrary };
