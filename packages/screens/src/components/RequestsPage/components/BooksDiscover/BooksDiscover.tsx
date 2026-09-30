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
import { Reveal } from '@ValenceUI/Reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { RevealGrid } from '@ValenceScreens/components/RequestsPage/components/RevealGrid/RevealGrid';
import { SHELF_STEP } from '@ValenceScreens/components/RequestsPage/SHELF_STEP';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { BooksDiscoverProps } from './BooksDiscover.types';
import { say } from '@ValenceI18n/say';

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

  const grid = (titles: readonly CatalogueTitle[], label: string) => (
    <RevealGrid label={label}>
      {titles.map((title, at) => (
        <RevealItem key={title.id} index={at}>
          <AskableBookTile title={title} onAsk={onAsk} />
        </RevealItem>
      ))}
    </RevealGrid>
  );

  const search = (
    <TextField
      label={say('common.searchForABook')}
      isLabelHidden
      value={typed}
      onValueChange={setTyped}
      placeholder={say('screens.requestsPage.booksDiscover.searchForABookOrAn')}
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
            said={say('screens.requestsPage.booksDiscover.theBooksCouldNotBeRead')}
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : found.data === undefined ? (
          <Spinner isCentered label={say('screens.requestsPage.booksDiscover.searchingForBooks')} />
        ) : found.data.length === 0 ? (
          <NothingHere
            of={BookOpenIcon}
            title={say('screens.requestsPage.booksDiscover.noBooksFound')}
            detail={say('screens.requestsPage.booksDiscover.tryTheTitleOrTheAuthor')}
          />
        ) : (
          grid(found.data, say('screens.requestsPage.booksDiscover.booksFound'))
        )}
      </div>
    );
  }

  if (discovered.isError) {
    return (
      <CouldNotRead
        said={say('screens.requestsPage.booksDiscover.whatBooksThereAreToAskCouldNotBeRead')}
        isTryingAgain={discovered.isFetching}
        onTryAgain={() => {
          void discovered.refetch();
        }}
      />
    );
  }

  if (discovered.data === undefined) {
    return (
      <Spinner
        isPageCentered
        label={say('screens.requestsPage.booksDiscover.readingWhatBooksThereAreTo')}
      />
    );
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
          title={say('screens.requestsPage.booksDiscover.noBooksToAskFor')}
          detail={say('screens.requestsPage.booksDiscover.openLibraryCouldNotBeReached')}
        />
      ) : (
        shelves.map((shelf, at) => (
          <Reveal key={shelf.id} delay={at * SHELF_STEP}>
            <section aria-label={shelf.title} className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-text">{shelf.title}</h2>

              {grid(shelf.titles, shelf.title)}
            </section>
          </Reveal>
        ))
      )}
    </div>
  );
};

BooksDiscover.displayName = 'BooksDiscover';

export { BooksDiscover };
