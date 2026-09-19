import { motion, useReducedMotionConfig } from 'motion/react';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { placeOfArrival } from '@ValenceScreens/requests/placeOfArrival';
import { DiscoverShelves } from './components/DiscoverShelves/DiscoverShelves';
import { MyRequests } from './components/MyRequests/MyRequests';

const MINE = 'mine';

const DISCOVER = 'discover';

/**
 * The Requests page: somewhere to find things that are not in the library yet and ask for them, in
 * the spirit of Overseerr, and to follow what you have asked for until it arrives. Discover shows
 * what is trending, popular and coming; My requests shows where each of yours has got to. Which is
 * showing is in the address, so either can be linked to.
 */
const RequestsPage = () => {
  const { place, go } = usePlace();
  const prefersReducedMotion = useReducedMotionConfig();
  const showing = place.requestsView === MINE ? MINE : DISCOVER;
  const ask = (asking: string) => {
    go({ asking });
  };

  return (
    <motion.main
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className={cn(RAIL.lane, 'flex flex-col gap-6 pt-6 pb-16')}
    >
      <h1 className="sr-only">Requests</h1>

      <Tabs
        value={showing}
        onValueChange={(next) => {
          go({ requestsView: next === MINE ? MINE : null });
        }}
      >
        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-col gap-6"
        >
          <div className={RAIL.inset}>
            <TabRow
              label="What to show"
              groups={[
                {
                  items: [
                    { id: DISCOVER, label: 'Discover' },
                    { id: MINE, label: 'My requests' },
                  ],
                },
              ]}
              value={showing}
            />
          </div>

          <TabPanel value={DISCOVER}>
            <DiscoverShelves onAsk={ask} />
          </TabPanel>

          <TabPanel value={MINE} className={cn(RAIL.inset, 'flex flex-col gap-4')}>
            <MyRequests
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
