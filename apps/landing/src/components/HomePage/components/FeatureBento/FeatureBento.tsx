import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Doodle } from '@ValenceUI/Doodle';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';
import { FeatureGroupGrid } from './components/FeatureGroupGrid/FeatureGroupGrid';
import { MoreFeatures } from './components/MoreFeatures/MoreFeatures';

/**
 * Everything Valence does, under one heading and split into its groups, each a ruled grid of cells
 * sharing their edges with a working piece of the product and its name, and a last cell after them
 * all saying there is more and where to find it.
 */
const FeatureBento = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section
      aria-label="What Valence does"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-10 xl:max-w-7xl 2xl:max-w-[96rem]"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="mb-14 grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16"
      >
        <h2 className="max-w-xl text-balance text-4xl font-semibold tracking-tight text-text lg:text-6xl">
          Everything a server for your{' '}
          <span className="relative inline-block font-accent font-normal italic tracking-normal">
            whole house
            <Doodle
              of="underline"
              delay={0.3}
              className="absolute -bottom-3 left-0 h-4 w-full text-accent"
            />
          </span>{' '}
          should do.
        </h2>
        <p className="max-w-md text-balance text-lg text-text-muted lg:justify-self-end">
          Watching, sharing, running it and building on it, without a subscription or anybody
          else&rsquo;s server in the way.
        </p>
      </motion.div>

      <div className="flex flex-col gap-20">
        {FEATURE_GROUPS.map((group, at) => (
          <FeatureGroupGrid key={group.title} group={group} number={at + 1} />
        ))}

        <motion.ul
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: '-80px' }}
          variants={groupVariants}
          className="grid grid-cols-1 gap-px overflow-hidden bg-border"
        >
          <MoreFeatures index={0} />
        </motion.ul>
      </div>
    </section>
  );
};

FeatureBento.displayName = 'FeatureBento';

export { FeatureBento };
