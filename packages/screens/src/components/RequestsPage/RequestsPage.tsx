import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotionConfig } from 'motion/react';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { placeOfArrival } from '@ValenceScreens/requests/placeOfArrival';
import { describeBrowsing } from '@ValenceScreens/requests/describeBrowsing';
import { readBrowsing } from '@ValenceScreens/requests/readBrowsing';
import { viewOfBrowsing } from '@ValenceScreens/requests/viewOfBrowsing';
import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';
import { CatalogueBrowser } from './components/CatalogueBrowser/CatalogueBrowser';
import { DiscoverShelves } from './components/DiscoverShelves/DiscoverShelves';
import { BooksDiscover } from './components/BooksDiscover/BooksDiscover';
import { MusicDiscover } from './components/MusicDiscover/MusicDiscover';
import { RequestsList } from './components/RequestsList/RequestsList';
import { say } from '@ValenceI18n/say';

const MINE = 'mine';

const MUSIC = 'music';

const BOOKS = 'books';

const DISCOVER = 'discover';

const MOVIES = 'film:popular';

const SHOWS = 'series:popular';

/**
 * Which tab a whole list belongs under, so that arriving at trending films from the shelf that
 * leads there still reads as being under Movies rather than nowhere.
 *
 * @param browsing - Which list is showing.
 * @returns The tab to mark.
 */
const browsingTab = (browsing: CatalogueBrowse): string =>
  browsing.kind === 'film' ? MOVIES : SHOWS;

/**
 * The Requests page: somewhere to find things that are not in the library yet and ask for them, in
 * the spirit of Overseerr, and to follow what you have asked for until it arrives. Discover shows
 * what is trending, popular and coming; Movies and Shows are those lists whole, going on as far as
 * they are scrolled; My requests shows where each of yours has got to. Which is showing is in the
 * address, so any of them can be linked to.
 */
const RequestsPage = () => {
  const { place, go } = usePlace();
  const prefersReducedMotion = useReducedMotionConfig();
  const discovered = useQuery(requestsQueries.discover());
  const browsing = readBrowsing(place.requestsView);

  const showing =
    browsing === null
      ? place.requestsView === MINE || place.requestsView === MUSIC || place.requestsView === BOOKS
        ? place.requestsView
        : DISCOVER
      : browsingTab(browsing);

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
      <h1 className="sr-only">{say('screens.requestsPage.heading')}</h1>

      <Tabs
        value={showing}
        onValueChange={(next) => {
          go({ requestsView: next === DISCOVER ? null : next });
        }}
      >
        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-col gap-6"
        >
          <div className={RAIL.inset}>
            <TabRow
              label={say('screens.requestsPage.tabsLabel')}
              groups={[
                {
                  items: [
                    { id: DISCOVER, label: say('screens.requestsPage.discover') },
                    { id: MOVIES, label: say('screens.requestsPage.movies') },
                    { id: SHOWS, label: say('screens.requestsPage.shows') },
                    { id: MUSIC, label: say('screens.requestsPage.music') },
                    { id: BOOKS, label: say('screens.requestsPage.books') },
                    { id: MINE, label: say('screens.requestsPage.mine') },
                  ],
                },
              ]}
              value={showing}
            />
          </div>

          <TabPanel value={DISCOVER}>
            <DiscoverShelves
              onAsk={ask}
              onBrowse={(next) => {
                go({ requestsView: viewOfBrowsing(next) });
              }}
              onBrowseStudio={(studioId) => {
                go({
                  requestsView: viewOfBrowsing({ kind: 'film', list: 'popular', studio: studioId }),
                });
              }}
            />
          </TabPanel>

          {browsing === null ? null : (
            <TabPanel value={showing} className={cn(RAIL.inset, 'flex flex-col gap-6')}>
              <h2 className="text-2xl font-semibold tracking-tight text-text">
                {describeBrowsing(browsing, studioName)}
              </h2>

              <CatalogueBrowser key={browsing.kind} browsing={browsing} onAsk={ask} />
            </TabPanel>
          )}

          <TabPanel value={MUSIC} className={cn(RAIL.inset, 'flex flex-col gap-6')}>
            <MusicDiscover onAsk={ask} />
          </TabPanel>

          <TabPanel value={BOOKS} className={cn(RAIL.inset, 'flex flex-col gap-6')}>
            <BooksDiscover onAsk={ask} />
          </TabPanel>

          <TabPanel value={MINE} className={cn(RAIL.inset, 'flex flex-col gap-4')}>
            <RequestsList
              onAsk={ask}
              onOpen={(kind, mediaId) => {
                go(placeOfArrival(kind, mediaId));
              }}
            />
          </TabPanel>
        </motion.div>
      </Tabs>
    </motion.main>
  );
};

RequestsPage.displayName = 'RequestsPage';

export { RequestsPage };
