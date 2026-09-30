import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { AskableMusicShelf } from '@ValenceScreens/components/RequestsPage/components/AskableMusicShelf/AskableMusicShelf';
import { StudiosRail } from '@ValenceScreens/components/RequestsPage/components/StudiosRail/StudiosRail';
import { TitleShelf } from '@ValenceScreens/components/RequestsPage/components/TitleShelf/TitleShelf';
import { Reveal } from '@ValenceUI/Reveal';
import { SHELF_STEP } from '@ValenceScreens/components/RequestsPage/SHELF_STEP';
import type { CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';
import type { DiscoverShelvesProps } from './DiscoverShelves.types';
import { say } from '@ValenceI18n/say';

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
        said={say('common.whatThereIsToAskForCouldNotBeRead')}
        isTryingAgain={discovered.isFetching}
        onTryAgain={() => {
          void discovered.refetch();
        }}
      />
    );
  }

  if (discovered.data === undefined) {
    return <Spinner isPageCentered label={say('common.readingWhatThereIsToAsk')} />;
  }

  const { shelves, studios } = discovered.data;

  const films = shelves.filter((shelf) => !isMusicShelf(shelf) && !isBookShelf(shelf));
  const music = shelves.filter((shelf) => isMusicShelf(shelf));

  return (
    <div className="flex flex-col gap-10">
      {studios.length === 0 ? null : (
        <Reveal delay={0}>
          <StudiosRail studios={studios} onOpen={onBrowseStudio} />
        </Reveal>
      )}

      {films.map((shelf, at) => (
        <Reveal key={shelf.id} delay={(at + 1) * SHELF_STEP}>
          <TitleShelf shelf={shelf} onAsk={onAsk} onBrowse={onBrowse} />
        </Reveal>
      ))}

      {music.map((shelf, at) => (
        <Reveal key={shelf.id} delay={(films.length + 1 + at) * SHELF_STEP}>
          <AskableMusicShelf shelf={shelf} onAsk={onAsk} />
        </Reveal>
      ))}
    </div>
  );
};

DiscoverShelves.displayName = 'DiscoverShelves';

export { DiscoverShelves };
