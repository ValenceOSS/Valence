import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DiscoverHero } from '@ValenceScreens/components/RequestsPage/components/DiscoverHero/DiscoverHero';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { AskableMusicShelf } from '@ValenceScreens/components/RequestsPage/components/AskableMusicShelf/AskableMusicShelf';
import { OnItsWayShelf } from '@ValenceScreens/components/RequestsPage/components/OnItsWayShelf/OnItsWayShelf';
import { StudiosRail } from '@ValenceScreens/components/RequestsPage/components/StudiosRail/StudiosRail';
import { TitleShelf } from '@ValenceScreens/components/RequestsPage/components/TitleShelf/TitleShelf';
import { Reveal } from '@ValenceUI/Reveal';
import { RAIL } from '@ValenceUI/tokens/rail';
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

const HERO_PAIRS = 3;

const STUDIOS_AFTER = 1;

/**
 * The Discover side of the Requests page, in the spirit of Overseerr: the titles trending this week
 * at the top, as the library's own hero is, then what you have asked for on its way, shelves of
 * films and series trending, popular and coming with the studios behind them after the first two,
 * and the albums and artists most listened to — each marked with what it is and whether it is in the library already or asked for. Choosing
 * one opens its page, where it can be asked for; the card at the end of a shelf opens the whole
 * list it came from.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onBrowse - Called with the whole list to show.
 * @param onBrowseStudio - Called with the studio whose films to show.
 * @param onOpenRequests - Called to show all of your requests.
 */
const DiscoverShelves = ({
  onAsk,
  onBrowse,
  onBrowseStudio,
  onOpenRequests,
}: DiscoverShelvesProps) => {
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
  const trendingFilms = shelves.find((shelf) => shelf.id === 'trending-films')?.titles ?? [];
  const trendingSeries = shelves.find((shelf) => shelf.id === 'trending-series')?.titles ?? [];
  const featured = Array.from({ length: HERO_PAIRS }, (_, at) => [
    trendingFilms[at],
    trendingSeries[at],
  ])
    .flat()
    .filter((title) => title !== undefined);
  const music = shelves.filter((shelf) => isMusicShelf(shelf));
  const studiosAfter = Math.min(STUDIOS_AFTER, films.length - 1);

  return (
    <div className="flex flex-col gap-10">
      {featured.length === 0 ? null : (
        <div className={RAIL.inset}>
          <DiscoverHero titles={featured} onAsk={onAsk} />
        </div>
      )}

      <OnItsWayShelf onAsk={onAsk} onOpenAll={onOpenRequests} />

      {films.length > 0 || studios.length === 0 ? null : (
        <Reveal delay={0}>
          <StudiosRail studios={studios} onOpen={onBrowseStudio} />
        </Reveal>
      )}

      {films.map((shelf, at) => (
        <Fragment key={shelf.id}>
          <Reveal delay={(at + 1) * SHELF_STEP}>
            <TitleShelf shelf={shelf} onAsk={onAsk} onBrowse={onBrowse} />
          </Reveal>

          {at !== studiosAfter || studios.length === 0 ? null : (
            <Reveal delay={(at + 1) * SHELF_STEP}>
              <StudiosRail studios={studios} onOpen={onBrowseStudio} />
            </Reveal>
          )}
        </Fragment>
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
