import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import type { DockedBandProps } from './DockedBand.types';

const DROP = { type: 'spring', stiffness: 420, damping: 18, mass: 0.7 } as const;

const FOLD = { duration: 0.24, ease: [0.23, 1, 0.32, 1] } as const;

const SHOWN = { height: '2.5rem', marginTop: '-0.25rem', marginBottom: '0.75rem' } as const;

const GONE = { height: 0, marginTop: '0rem', marginBottom: '0rem' } as const;

/**
 * The hero's band again, small, running across the top of the navigation once the band itself has
 * scrolled away, in the row the line about the newest release folds out of: it drops in on a spring
 * that overshoots and settles, as tall as the row of links beneath it and rounded to follow the
 * bar's own corners, and folds back up when the band comes back into view. Whoever asked for stillness sees it simply appear.
 *
 * @param isShown - Whether the hero's band has scrolled out of sight.
 */
const DockedBand = ({ isShown }: DockedBandProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <AnimatePresence initial={false}>
      {isShown ? (
        <motion.div
          key="docked-band"
          aria-hidden
          initial={GONE}
          animate={{ ...SHOWN, transition: isStill ? { duration: 0 } : DROP }}
          exit={{ ...GONE, transition: isStill ? { duration: 0 } : FOLD }}
          className="col-span-full -mx-1.5 flex items-center overflow-hidden rounded-t-[calc(1.25rem-5px)] sm:rounded-t-[calc(1.5rem-5px)] bg-accent text-accent-contrast sm:-mx-3"
        >
          <ValenceRun repeats={32} className="text-sm" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

DockedBand.displayName = 'DockedBand';

export { DockedBand };
