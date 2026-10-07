import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import type { DockedBandProps } from './DockedBand.types';

const DROP = { type: 'spring', stiffness: 420, damping: 18, mass: 0.7 } as const;

/**
 * The hero's band again, small, pinned across the top of the page above the navigation once the
 * band itself has scrolled away: it drops in on a spring that overshoots and settles, and folds
 * back up when the band comes back into view. Whoever asked for stillness sees it simply appear.
 *
 * @param isShown - Whether the hero's band has scrolled out of sight.
 */
const DockedBand = ({ isShown }: DockedBandProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <AnimatePresence initial={false}>
      {isShown ? (
        <motion.div
          aria-hidden
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={isStill ? { duration: 0 } : DROP}
          className="-mx-4 self-stretch overflow-hidden bg-accent text-accent-contrast sm:-mx-6"
        >
          <ValenceRun repeats={32} className="py-1.5 text-sm" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

DockedBand.displayName = 'DockedBand';

export { DockedBand };
