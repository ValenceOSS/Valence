import { useEffect } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import type { WelcomeToValenceProps } from './WelcomeToValence.types';

const STAYS_MS = 2600;

/**
 * The moment at the end of setting up, before the library arrives.
 *
 * Setting a household up is three forms in a row, and a flow that ends by simply cutting to the
 * home page reads as having been dropped rather than finished. This is the full stop: the mark, the
 * household's own name back at them, and then it gets out of the way on its own.
 *
 * It leaves by itself rather than on a button, because asking somebody to click past a
 * congratulation is asking them to do a fourth thing.
 *
 * @param name - What this instance is called.
 * @param household - What they have just decided to call the household.
 * @param onFinished - Told when it has said its piece and the library should take over.
 */
const WelcomeToValence = ({ name, household, onFinished }: WelcomeToValenceProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    const leaves = setTimeout(onFinished, STAYS_MS);

    return () => {
      clearTimeout(leaves);
    };
  }, [onFinished]);

  const rises = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion === true ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: 'easeOut' as const },
  });

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.span
        initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <Logo size={96} isSolid label={name} />
      </motion.span>

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
  );
};

WelcomeToValence.displayName = 'WelcomeToValence';

export { WelcomeToValence };
