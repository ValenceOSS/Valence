import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useArrivals } from '@ValenceScreens/motion/useArrivals';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Compass as CompassIcon } from '@keyline-icons/react';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { MediaCard } from '@ValenceUI/MediaCard';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Spinner } from '@ValenceUI/Spinner';
import { VirtualGrid } from '@ValenceUI/VirtualGrid';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { CatalogueGridProps } from './CatalogueGrid.types';
import { BackToTop } from '@ValenceUI/BackToTop';
import { useIsTitleWatched } from '@ValenceScreens/requests/useIsTitleWatched';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { say } from '@ValenceI18n/say';

const LEAST_CARD_WIDTH = 170;

const POSTER_ROW_HEIGHT = 330;

const BEFORE_THE_END = '0px 0px 800px 0px';

/**
 * A whole list of films or series to ask for, laid out as a grid that goes on as far as it is
 * scrolled: the next page is read when the foot of the one showing comes near, so there is no
 * button to press and no page to turn. Cards arrive one after another the first time they are
 * drawn — a page appended below rises in as the first did — but a card scrolled away and back is
 * simply there.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param filters - What it is narrowed by, where anything is, which changes what an empty page means.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const CatalogueGrid = ({ browsing, filters = {}, onAsk }: CatalogueGridProps) => {
  const isWatched = useIsTitleWatched();
  const pages = useInfiniteQuery(requestsQueries.catalogueBrowse(browsing, true, filters));
  const [end, setEnd] = useState<HTMLDivElement | null>(null);
  const arrivalOf = useArrivals();

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pages;

  useEffect(() => {
    if (end === null || !hasNextPage || isFetchingNextPage) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const watching = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) {
          void fetchNextPage();
        }
      },
      { rootMargin: BEFORE_THE_END },
    );

    watching.observe(end);

    return () => {
      watching.disconnect();
    };
  }, [end, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (pages.isError) {
    return (
      <CouldNotRead
        said={say('common.whatThereIsToAskForCouldNotBeRead')}
        isTryingAgain={pages.isFetching}
        onTryAgain={() => {
          void pages.refetch();
        }}
      />
    );
  }

  if (pages.data === undefined) {
    return <Spinner isPageCentered label={say('common.readingWhatThereIsToAsk')} />;
  }

  const titles = pages.data.pages.flatMap((page) => page.titles);

  if (titles.length === 0) {
    return (
      <NothingHere
        of={CompassIcon}
        title={say('screens.requestsPage.catalogueGrid.nothingToAskForHere')}
        detail={
          Object.keys(filters).length === 0
            ? say('screens.requestsPage.catalogueGrid.theCatalogueListedNothing')
            : say('screens.requestsPage.catalogueGrid.nothingInTheCatalogueMatchesThose')
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <BackToTop />

      <VirtualGrid
        count={titles.length}
        label={say('common.whatThereIsToAskFor')}
        leastCardWidth={LEAST_CARD_WIDTH}
        rowHeight={POSTER_ROW_HEIGHT}
      >
        {(at) => {
          const title = titles[at];

          if (title === undefined) {
            return null;
          }

          const key = `${title.kind}:${title.id}`;

          return (
            <motion.div key={key} {...arrivalOf(key)}>
              <MediaCard
                title={title.title}
                subtitle={title.year?.toString() ?? ''}
                {...describeCatalogueCard(title, isWatched(title))}
                {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
                onSelect={() => {
                  onAsk(askingOf(title));
                }}
              />
            </motion.div>
          );
        }}
      </VirtualGrid>

      <div ref={setEnd} className="flex justify-center">
        {isFetchingNextPage ? (
          <Spinner label={say('screens.libraryBrowser.findingMoreToWatch')} />
        ) : null}
      </div>
    </div>
  );
};

CatalogueGrid.displayName = 'CatalogueGrid';

export { CatalogueGrid };
