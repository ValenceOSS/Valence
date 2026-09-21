import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { AskableMusicShelf } from '@ValenceScreens/components/RequestsPage/components/AskableMusicShelf/AskableMusicShelf';
import { StudiosRail } from '@ValenceScreens/components/RequestsPage/components/StudiosRail/StudiosRail';
import { TitleShelf } from '@ValenceScreens/components/RequestsPage/components/TitleShelf/TitleShelf';
import type { CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';
import type { DiscoverShelvesProps } from './DiscoverShelves.types';

/**
 * Whether a shelf holds music, which decides how it is drawn: covers and faces rather than posters.
 *
 * @param shelf - The shelf.
 * @returns Whether everything on it is music.
 */
const isMusicShelf = (shelf: CatalogueShelf): boolean =>
  shelf.titles.every((title) => isMusicRequest(title.kind));

/**
 * Whether a shelf holds books, which have a tab of their own and are drawn there rather than among
 * the posters of the films.
 *
 * @param shelf - The shelf.
 * @returns Whether everything on it is a book.
 */
const isBookShelf = (shelf: CatalogueShelf): boolean =>
  shelf.titles.every((title) => isBookRequest(title.kind));

/**
 * The Discover side of the Requests page, in the spirit of Overseerr: shelves of films and series
 * trending, popular and coming, the studios behind them, and the albums and artists most listened
 * to — each marked with what it is and whether it is in the library already or asked for. Choosing
 * one opens its page, where it can be asked for; the card at the end of a shelf opens the whole
 * list it came from.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onBrowse - Called with the whole list to show.
 * @param onBrowseStudio - Called with the studio whose films to show.
 */
const DiscoverShelves = ({ onAsk, onBrowse, onBrowseStudio }: DiscoverShelvesProps) => {
  const discovered = useQuery(requestsQueries.discover());

  if (discovered.isError) {
    return (
      <CouldNotRead
        what="What there is to ask for"
        isTryingAgain={discovered.isFetching}
        onTryAgain={() => {
          void discovered.refetch();
        }}
      />
    );
  }

  if (discovered.data === undefined) {
    return <Spinner isCentered label="Reading what there is to ask for" />;
  }

  const { shelves, studios } = discovered.data;

  return (
    <div className="flex flex-col gap-10">
      {shelves
        .filter((shelf) => !isMusicShelf(shelf) && !isBookShelf(shelf))
        .map((shelf) => (
          <TitleShelf key={shelf.id} shelf={shelf} onAsk={onAsk} onBrowse={onBrowse} />
        ))}

      {studios.length === 0 ? null : <StudiosRail studios={studios} onOpen={onBrowseStudio} />}

      {shelves
        .filter((shelf) => isMusicShelf(shelf))
        .map((shelf) => (
          <AskableMusicShelf key={shelf.id} shelf={shelf} onAsk={onAsk} />
        ))}
    </div>
  );
};

DiscoverShelves.displayName = 'DiscoverShelves';

export { DiscoverShelves };
