import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { AgeRating } from '@ValenceUI/AgeRating';
import { sayContains } from '@ValenceClient/library/sayContains';
import type { ContentAdvisoryProps } from './ContentAdvisory.types';

/**
 * What a title is rated and what it contains, held in the top corner for the first moments of
 * playing it, the way the big streaming services say it as a show begins. Draws nothing where there
 * is neither a rating nor anything worth warning of.
 *
 * @param certification - Its age rating, where it has one.
 * @param region - Whose board issued the rating.
 * @param advisories - What it contains, where the catalogue says.
 * @param isShown - Whether it is the moment to say it.
 */
const ContentAdvisory = ({ certification, region, advisories, isShown }: ContentAdvisoryProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const contains = sayContains(advisories);
  const hasRating = certification !== null && certification !== '' && region !== null;

  return (
    <AnimatePresence>
      {!isShown || (!hasRating && contains === null) ? null : (
        <motion.div
          data-slot="content-advisory"
          initial={{ opacity: 0, x: prefersReducedMotion === true ? 0 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion === true ? 0 : 0.4, ease: 'easeOut' }}
          className="pointer-events-none absolute top-[calc(4.5rem+env(safe-area-inset-top,0px))] left-[calc(1.5rem+env(safe-area-inset-left,0px))] z-10 flex max-w-md items-center gap-3 rounded-r-md border-l-2 border-on-scrim/80 bg-scrim/60 py-1.5 pr-3 pl-3 text-on-scrim"
        >
          {hasRating ? <AgeRating certification={certification} region={region} /> : null}
          {contains === null ? null : <span className="text-sm font-medium">{contains}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ContentAdvisory.displayName = 'ContentAdvisory';

export { ContentAdvisory };
