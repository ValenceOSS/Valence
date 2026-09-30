import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { FeatureCard } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard';
import type { FeatureCardShape } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard.types';
import type { FeatureSectionProps } from './FeatureSection.types';

const SHAPES: Record<number, readonly FeatureCardShape[]> = {
  3: ['square', 'square', 'square'],
  4: ['wide', 'square', 'square', 'wide'],
};

/**
 * One themed group of features — Viewing, Sharing, and so on — its heading and a line about it set
 * side by side over a grid of rounded cards set apart from one another, which arrives feature by
 * feature as it scrolls into view. A group of three sits in three equal columns, and a group of
 * four alternates a wide feature with a square one.
 *
 * @param group - The group's title, its one-line description, and its features.
 * @param number - Where the group comes on the page, which numbers its figures.
 */
const FeatureSection = ({ group, number }: FeatureSectionProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section
      aria-label={group.title}
      className="mx-auto max-w-6xl px-5 py-16 sm:px-10 xl:max-w-7xl"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="mb-12 grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16"
      >
        <h2 className="max-w-md text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
          {group.title}
        </h2>
        <p className="max-w-md text-balance text-text-muted lg:justify-self-end">{group.detail}</p>
      </motion.div>

      <motion.ul
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={groupVariants}
        className="grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {group.features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            figure={`${number.toString()}.${(index + 1).toString()}`}
            shape={SHAPES[group.features.length]?.[index] ?? 'square'}
          />
        ))}
      </motion.ul>
    </section>
  );
};

FeatureSection.displayName = 'FeatureSection';

export { FeatureSection };
