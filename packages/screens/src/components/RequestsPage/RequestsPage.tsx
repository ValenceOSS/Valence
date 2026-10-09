import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { placeOfArrival } from '@ValenceScreens/requests/placeOfArrival';
import { describeBrowsing } from '@ValenceScreens/requests/describeBrowsing';
import { readBrowsing } from '@ValenceScreens/requests/readBrowsing';
import { viewOfBrowsing } from '@ValenceScreens/requests/viewOfBrowsing';
import { requestsViewShown } from '@ValenceScreens/requests/requestsViewShown';
import { requestsViewsFor } from '@ValenceScreens/requests/requestsViewsFor';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { CatalogueBrowser } from './components/CatalogueBrowser/CatalogueBrowser';
import { DiscoverShelves } from './components/DiscoverShelves/DiscoverShelves';
import { BooksDiscover } from './components/BooksDiscover/BooksDiscover';
import { MusicDiscover } from './components/MusicDiscover/MusicDiscover';
import { RequestsList } from './components/RequestsList/RequestsList';
import { DiscoverResults } from './components/DiscoverResults/DiscoverResults';
import { DiscoverSearchField } from './components/DiscoverSearchField/DiscoverSearchField';
import { Button } from '@ValenceUI/Button';
import { readDiscoverSearch } from '@ValenceScreens/requests/readDiscoverSearch';
import { viewOfDiscoverSearch } from '@ValenceScreens/requests/viewOfDiscoverSearch';
import { say } from '@ValenceI18n/say';

/**
 * The Requests page: somewhere to find things that are not in the library yet and ask for them, in
 * the spirit of Overseerr, and to follow what you have asked for until it arrives. Discover shows
 * what is trending, popular and coming, and searches the catalogues for anything else to ask for;
 * Movies and Shows are those lists whole, going on as far as
 * they are scrolled; My requests shows where each of yours has got to. Which is showing is in the
 * address, so any of them can be linked to; one for a kind no library takes requests for shows
 * Discover instead.
 */
const RequestsPage = () => {
  const { place, go } = usePlace();
  const prefersReducedMotion = useReducedMotionConfig();
  const discovered = useQuery(requestsQueries.discover());
  const kinds = useRequestableKinds();
  const isKnown = useQuery(requestsQueries.availability()).data !== undefined;
  const browsing = readBrowsing(place.requestsView);
  const finding = readDiscoverSearch(place.requestsView);
  const shown = requestsViewShown(place.requestsView);
  const showing =
    !isKnown || requestsViewsFor(kinds).some((view) => view.id === shown) ? shown : 'discover';

  const ask = (asking: string) => {
    go({ asking });
  };

  const studioName =
    discovered.data?.studios.find((studio) => studio.id === browsing?.studio)?.name ?? null;

  return (
    <motion.main
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className={cn(RAIL.lane, 'flex flex-col gap-6 pt-6 pb-16')}
    >
      <h1 className="sr-only">{say('common.requests')}</h1>

      <AnimatePresence mode="wait">
        <motion.div
          key={place.requestsView ?? 'discover'}
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          exit="gone"
        >
          <motion.div
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className={cn(
              showing === 'discover' && finding === null ? '' : RAIL.inset,
              'flex flex-col gap-6',
            )}
          >
            {showing === 'discover' ? (
              <div className={finding === null ? RAIL.inset : ''}>
                <DiscoverSearchField
                  key={finding ?? ''}
                  query={finding ?? ''}
                  onSearch={(query) => {
                    go({ requestsView: viewOfDiscoverSearch(query) });
                  }}
                />
              </div>
            ) : null}

            {showing === 'discover' && finding !== null ? (
              <>
                <span className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-text">
                    {say('screens.requestsPage.resultsForQuery', { query: finding })}
                  </h2>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      go({ requestsView: null });
                    }}
                  >
                    {say('screens.requestsPage.backToDiscover')}
                  </Button>
                </span>

                <DiscoverResults query={finding} onAsk={ask} />
              </>
            ) : showing === 'discover' ? (
              <DiscoverShelves
                onAsk={ask}
                onBrowse={(next) => {
                  go({ requestsView: viewOfBrowsing(next) });
                }}
                onBrowseStudio={(studioId) => {
                  go({
                    requestsView: viewOfBrowsing({
                      kind: 'film',
                      list: 'popular',
                      studio: studioId,
                    }),
                  });
                }}
              />
            ) : browsing !== null && (!isKnown || kinds.has(browsing.kind)) ? (
              <>
                <h2 className="text-2xl font-semibold tracking-tight text-text">
                  {describeBrowsing(browsing, studioName)}
                </h2>

                <CatalogueBrowser key={browsing.kind} browsing={browsing} onAsk={ask} />
              </>
            ) : showing === 'music' ? (
              <MusicDiscover onAsk={ask} />
            ) : showing === 'books' ? (
              <BooksDiscover onAsk={ask} />
            ) : (
              <RequestsList
                onAsk={ask}
                onOpen={(kind, mediaId) => {
                  go(placeOfArrival(kind, mediaId));
                }}
              />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.main>
  );
};

RequestsPage.displayName = 'RequestsPage';

export { RequestsPage };
