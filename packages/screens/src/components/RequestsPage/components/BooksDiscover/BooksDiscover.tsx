import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen as BookOpenIcon, Search as SearchIcon } from '@keyline-icons/react';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { AskableBookTile } from '@ValenceScreens/components/RequestsPage/components/AskableBookTile/AskableBookTile';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { BooksDiscoverProps } from './BooksDiscover.types';

const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

/**
 * Everything to read there is to ask for, laid out as on the pages for films, shows and music: a
 * search for a book by its title or its author, and beneath it — while nothing is typed — what is
 * being read most and the best known of a few subjects, each as a heading over a grid.
 *
 * @param onAsk - Told what was chosen, in the form the address knows it by.
 */
const BooksDiscover = ({ onAsk }: BooksDiscoverProps) => {
  const [typed, setTyped] = useState('');
  const query = useDeferredValue(typed.trim());
  const discovered = useQuery(requestsQueries.discover());
  const found = useQuery(requestsQueries.askableSearch(query, 'book'));

  const grid = (titles: readonly CatalogueTitle[]) => (
    <div className={GRID}>
      {titles.map((title) => (
        <AskableBookTile key={title.id} title={title} onAsk={onAsk} />
      ))}
    </div>
  );

  const search = (
    <TextField
      label="Search for a book"
      isLabelHidden
      value={typed}
      onValueChange={setTyped}
      placeholder="Search for a book or an author"
      icon={<Icon of={SearchIcon} size={16} />}
      className="max-w-md"
    />
  );

  if (query !== '') {
    return (
      <div className="flex flex-col gap-6">
        {search}

        {found.isError ? (
          <CouldNotRead
            what="The books"
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : found.data === undefined ? (
          <Spinner isCentered label="Searching for books" />
        ) : found.data.length === 0 ? (
          <NothingHere
            of={BookOpenIcon}
            title="No books found"
            detail="Try the title, or the author, another way."
          />
        ) : (
          grid(found.data)
        )}
      </div>
    );
  }

  if (discovered.isError) {
    return (
      <CouldNotRead
        what="What books there are to ask for"
        isTryingAgain={discovered.isFetching}
        onTryAgain={() => {
          void discovered.refetch();
        }}
      />
    );
  }

  if (discovered.data === undefined) {
    return <Spinner isCentered label="Reading what books there are to ask for" />;
  }

  const shelves = discovered.data.shelves.filter(
    (shelf) => shelf.titles.length > 0 && shelf.titles.every((title) => isBookRequest(title.kind)),
  );

  return (
    <div className="flex flex-col gap-10">
      {search}

      {shelves.length === 0 ? (
        <NothingHere
          of={BookOpenIcon}
          title="No books to ask for"
          detail="Open Library could not be reached, or has nothing to suggest just now. You can still search for a book."
        />
      ) : (
        shelves.map((shelf) => (
          <section key={shelf.id} aria-label={shelf.title} className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-text">{shelf.title}</h2>

            {grid(shelf.titles)}
          </section>
        ))
      )}
    </div>
  );
};

BooksDiscover.displayName = 'BooksDiscover';

export { BooksDiscover };
