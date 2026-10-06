import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Doodle } from '@ValenceUI/Doodle';
import { FeatureCard } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';
import type { FeatureCardShape } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard.types';

const ROW_PATTERN: readonly FeatureCardShape[] = [
  'half',
  'half',
  'third',
  'third',
  'third',
  'full',
];

/**
 * Everything Valence does, in one grid rather than a section apiece: two cards side by side, three
 * beneath them, then one right across, and round again, so the page reads as one piece of work
 * rather than a stack of chapters. Each card says which part of Valence it belongs to beside its
 * number, and they arrive one after another as they scroll into view.
 */
const FeatureBento = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const features = FEATURE_GROUPS.flatMap((group, groupAt) =>
    group.features.map((feature, featureAt) => ({
      feature,
      group: group.title,
      figure: `${(groupAt + 1).toString()}.${(featureAt + 1).toString()}`,
    })),
  );

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
        className="grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        {features.map(({ feature, group, figure }, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            figure={figure}
            group={group}
            shape={ROW_PATTERN[index % ROW_PATTERN.length] ?? 'third'}
          />
        ))}
      </motion.ul>
    </section>
  );
};

FeatureBento.displayName = 'FeatureBento';

export { FeatureBento };
