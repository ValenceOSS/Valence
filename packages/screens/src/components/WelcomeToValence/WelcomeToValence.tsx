import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { WelcomeToValenceProps } from './WelcomeToValence.types';

const MARKS_PLACE = 'valence-mark';

const WORDS_CLEAR_MS = 260;

/**
 * The moment at the end of setting up, before the library arrives.
 *
 * Setting a household up is three forms in a row, and a flow that ends by cutting straight to the
 * home page reads as having been dropped rather than finished. This is the full stop: the mark, the
 * household's own name back at them, and a way on.
 *
 * It waits to be dismissed rather than timing out. A congratulation nobody has time to read is
 * worse than no congratulation, and there is no right number of seconds — it depends entirely on
 * how fast the person reads and whether they looked away.
 *
 * Pressing on does not cut. The words and the button clear first, and the mark carries the same
 * layout identity the way in gives it, so it flies up into the corner of the bar it lands in rather
 * than being replaced by a different mark that happens to look the same. That is the handoff the
 * splash screen already performs, borrowed rather than invented.
 *
 * @param name - What this instance is called.
 * @param household - What they have just decided to call the household.
 * @param onFinished - Told when they are ready for the library to take over.
 */
const WelcomeToValence = ({ name, household, onFinished }: WelcomeToValenceProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isLeaving, setIsLeaving] = useState(false);

  const move = prefersReducedMotion === true ? stillTransition : liquidSpring;

  const rises = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion === true ? 0 : 12 },
    animate: isLeaving
      ? { opacity: 0, y: prefersReducedMotion === true ? 0 : -8 }
      : { opacity: 1, y: 0 },
    transition: isLeaving
      ? { duration: 0.2, ease: 'easeIn' as const }
      : { delay, duration: 0.6, ease: 'easeOut' as const },
  });

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-7 px-6 text-center"
    >
      <motion.span
        layoutId={MARKS_PLACE}
        initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', layout: move }}
        className="flex items-center"
      >
        <Logo size={96} isSolid label={name} />
      </motion.span>

      <motion.div {...rises(0.35)} className="flex flex-col items-center gap-3">
        <h1 className="bg-gradient-to-br from-text via-text to-accent bg-clip-text text-[clamp(2rem,6vw,3.25rem)] font-semibold tracking-[-0.04em] text-transparent">
          {`Welcome to ${name}`}
        </h1>

        <p className="max-w-sm text-base text-text-muted">
          {`${household} is ready. Everything else can be changed whenever you like.`}
        </p>
      </motion.div>

      <motion.div {...rises(0.6)}>
        <Button
          variant="glossy"
          size="lg"
          disabled={isLeaving}
          onClick={() => {
            setIsLeaving(true);

            setTimeout(onFinished, prefersReducedMotion === true ? 0 : WORDS_CLEAR_MS);
          }}
        >
          Start watching
          <Icon of={ChevronRightIcon} size={18} />
        </Button>
      </motion.div>
    </div>
  );
};

WelcomeToValence.displayName = 'WelcomeToValence';

export { WelcomeToValence };
