import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { StackingMark } from '@ValenceUI/StackingMark';

const SEEN = 'valence-splash-seen';

const STAYS_MS = 1450;

const NAME_ARRIVES = 0.64;

/**
 * Whether the splash has already played in this tab, so it greets a visitor once rather than on
 * every page they open.
 *
 * @returns Whether it has played.
 */
const hasPlayed = (): boolean => {
  try {
    return sessionStorage.getItem(SEEN) === 'yes';
  } catch {
    return true;
  }
};

/**
 * Remembers for this tab that the splash has played.
 */
const notePlayed = () => {
  try {
    sessionStorage.setItem(SEEN, 'yes');
  } catch {
    return;
  }
};

/**
 * The first thing getvalence.app shows a visitor, once a tab: the mark stacking itself layer by
 * layer with the name wiping in beside it as the top layer lands, then the whole thing fading off
 * the page beneath. It never takes a click from the page under it, and whoever asked for stillness
 * never sees it at all.
 */
const LandingSplash = () => {
  const isStill = useReducedMotionConfig() === true;
  const [isShown, setIsShown] = useState(() => !isStill && !hasPlayed());

  useEffect(() => {
    if (!isShown) {
      return undefined;
    }

    notePlayed();
    const timer = setTimeout(() => {
      setIsShown(false);
    }, STAYS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isShown]);

  return (
    <AnimatePresence>
      {isShown ? (
        <motion.div
          key="splash"
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[var(--frame-back)]"
        >
          <span className="flex items-baseline gap-[0.25em] text-[clamp(3rem,8vw,5.5rem)] font-[800] leading-none tracking-[-0.045em] text-text">
            <StackingMark className="h-[1cap]" />
            <motion.span
              initial={{ clipPath: 'inset(-20% 100% -20% 0)', x: -12, opacity: 0.4 }}
              animate={{ clipPath: 'inset(-20% 0% -20% 0)', x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: NAME_ARRIVES, ease: [0.23, 1, 0.32, 1] }}
              className="inline-block pe-[0.06em]"
            >
              Valence
            </motion.span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

LandingSplash.displayName = 'LandingSplash';

export { LandingSplash };
