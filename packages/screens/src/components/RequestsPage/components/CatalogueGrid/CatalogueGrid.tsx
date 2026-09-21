import { useEffect, useState } from 'react';
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
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';

const LEAST_CARD_WIDTH = 170;

const POSTER_ROW_HEIGHT = 330;

const BEFORE_THE_END = '0px 0px 800px 0px';

/**
 * A whole list of films or series to ask for, laid out as a grid that goes on as far as it is
 * scrolled: the next page is read when the foot of the one showing comes near, so there is no
 * button to press and no page to turn.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param filters - What it is narrowed by, where anything is, which changes what an empty page means.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const CatalogueGrid = ({ browsing, filters = {}, onAsk }: CatalogueGridProps) => {
  const pages = useInfiniteQuery(requestsQueries.catalogueBrowse(browsing, true, filters));
  const [end, setEnd] = useState<HTMLDivElement | null>(null);

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
        what="What there is to ask for"
        isTryingAgain={pages.isFetching}
        onTryAgain={() => {
          void pages.refetch();
        }}
      />
    );
  }

  if (pages.data === undefined) {
    return <Spinner isCentered label="Reading what there is to ask for" />;
  }

  const titles = pages.data.pages.flatMap((page) => page.titles);

  if (titles.length === 0) {
    return (
      <NothingHere
        of={CompassIcon}
        title="Nothing to ask for here"
        detail={
          Object.keys(filters).length === 0
            ? 'The catalogue listed nothing.'
            : 'Nothing in the catalogue matches those filters.'
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <BackToTop />

      <VirtualGrid
        count={titles.length}
        label="What there is to ask for"
        leastCardWidth={LEAST_CARD_WIDTH}
        rowHeight={POSTER_ROW_HEIGHT}
      >
        {(at) => {
          const title = titles[at];

          if (title === undefined) {
            return null;
          }

          return (
            <MediaCard
              key={`${title.kind}:${title.id}`}
              title={title.title}
              subtitle={title.year?.toString() ?? ''}
              {...describeCatalogueCard(title)}
              {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
              onSelect={() => {
                onAsk(askingOf(title));
              }}
            />
          );
        }}
      </VirtualGrid>

      <div ref={setEnd} className="flex justify-center">
        {isFetchingNextPage ? <Spinner label="Reading more" /> : null}
      </div>
    </div>
  );
};

CatalogueGrid.displayName = 'CatalogueGrid';

export { CatalogueGrid };
