import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Doodle } from '@ValenceUI/Doodle';
import { FeatureCard } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';
import { MoreFeatures } from './components/MoreFeatures/MoreFeatures';

/**
 * Everything Valence does, in one ruled grid rather than a section apiece: cells three to a row,
 * sharing their edges, under a heavier rule across the top, each with its mark, a working piece of
 * the product and its name; one cell in six is turned dark so the eye has somewhere to land, and the
 * last says there is more and where to find it. They arrive one after another as they scroll in.
 */
const FeatureBento = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const features = FEATURE_GROUPS.flatMap((group) => group.features);

  return (
    <section
      aria-label="What Valence does"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-10 xl:max-w-7xl"
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

      <motion.ul
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={groupVariants}
        className="grid grid-cols-1 gap-px overflow-hidden border-t-2 border-text bg-border sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            isLit={index % 6 === 3}
          />
        ))}
        <MoreFeatures index={features.length} />
      </motion.ul>
    </section>
  );
};

FeatureBento.displayName = 'FeatureBento';

export { FeatureBento };
