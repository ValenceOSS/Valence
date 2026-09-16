import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { GlassPanel } from '@ValenceUI/GlassPanel';

/**
 * The last thing on the page: one more way to go and actually run it.
 */
const CallToAction = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-10">
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
      >
        <GlassPanel
          elevation="floating"
          className="flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Run it on what you already have
          </h2>

          <p className="max-w-xl text-text-muted">
            One Docker image, a compose file, and a folder of media. Nothing else to buy.
          </p>

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
        </GlassPanel>
      </motion.div>
    </section>
  );
};

CallToAction.displayName = 'CallToAction';

export { CallToAction };
