import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import type { WelcomeToValenceProps } from './WelcomeToValence.types';

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
 * @param name - What this instance is called.
 * @param household - What they have just decided to call the household.
 * @param onFinished - Told when they are ready for the library to take over.
 */
const WelcomeToValence = ({ name, household, onFinished }: WelcomeToValenceProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  const rises = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion === true ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: 'easeOut' as const },
  });

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-7 px-6 text-center"
    >
      <motion.span
        initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <Logo size={96} isSolid label={name} />
      </motion.span>

      <div className="flex flex-col gap-3">
        <motion.h1
          {...rises(0.35)}
          className="bg-gradient-to-br from-text via-text to-accent bg-clip-text text-[clamp(2rem,6vw,3.25rem)] font-semibold tracking-[-0.04em] text-transparent"
        >
          {`Welcome to ${name}`}
        </motion.h1>

        <motion.p {...rises(0.6)} className="max-w-sm text-base text-text-muted">
          {`${household} is ready. Everything else can be changed whenever you like.`}
        </motion.p>
      </div>

      <motion.div {...rises(0.85)}>
        <Button variant="glossy" size="lg" onClick={onFinished}>
          Start watching
          <Icon of={ArrowRight01Icon} size={18} />
        </Button>
      </motion.div>
    </div>
  );
};

WelcomeToValence.displayName = 'WelcomeToValence';

export { WelcomeToValence };
