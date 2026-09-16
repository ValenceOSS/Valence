import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { AppPreview } from './components/AppPreview/AppPreview';

const LEGIBLE = 'drop-shadow-[var(--shadow-legible)]';

/**
 * The first thing anybody sees: what Valence is, in one line, where to go next, and the app itself
 * rather than a description of it. Its own shader background lives in `LandingShell` instead of
 * here, so it isn't torn down and rebuilt every time this mounts.
 */
const Hero = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section className="relative flex h-svh flex-col items-center justify-center overflow-hidden pt-16 pb-10 sm:pt-20">
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="shown"
        className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-5 text-center sm:px-10"
      >
        <motion.p
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className={cn(
            'text-sm font-medium uppercase tracking-[0.16em] text-on-scrim/80',
            LEGIBLE,
          )}
        >
          Self-hosted. Open source. Yours.
        </motion.p>

        <motion.h1
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className={cn('text-4xl font-semibold tracking-tight text-on-scrim sm:text-6xl', LEGIBLE)}
        >
          Your films and programmes, on every screen in the house.
        </motion.h1>

        <motion.p
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className={cn('max-w-2xl text-base text-on-scrim/80', LEGIBLE)}
        >
          Valence is a streaming platform you run yourself, from a server you own. Point it at your
          library and it plays what's already there. Nothing rewritten, nothing phoned home.
        </motion.p>

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-wrap items-center justify-center gap-3 pt-1"
        >
          <Button
            variant="glossy"
            size="lg"
            onClick={() => {
              window.open(
                'https://github.com/MarquesCoding/Valence',
                '_blank',
                'noopener,noreferrer',
              );
            }}
          >
            Get started
          </Button>

          <Button
            variant="overlay"
            size="lg"
            onClick={() => {
              window.open(
                'https://github.com/MarquesCoding/Valence/blob/main/DEPLOYMENT.md',
                '_blank',
                'noopener,noreferrer',
              );
            }}
          >
            Read the deployment guide
          </Button>
        </motion.div>

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className="w-full pt-4"
        >
          <AppPreview />
        </motion.div>
      </motion.div>
    </section>
  );
};

Hero.displayName = 'Hero';

export { Hero };
