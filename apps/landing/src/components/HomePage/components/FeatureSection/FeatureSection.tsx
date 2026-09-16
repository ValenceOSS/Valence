import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { FeatureCard } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard';
import type { FeatureSectionProps } from './FeatureSection.types';

const REST_COLUMNS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
};

const DEFAULT_REST_COLUMNS = 'sm:grid-cols-2 lg:grid-cols-3';

/**
 * One themed group of features — Viewing, Sharing, and so on — a heading over a grid that arrives
 * card by card as it scrolls into view.
 *
 * @param group - The group's title, its one-line description, and its features.
 */
const FeatureSection = ({ group }: FeatureSectionProps) => {
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
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="mb-10 flex flex-col gap-2"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-text lg:text-4xl">
          {group.title}
        </h2>
        <p className="text-text-muted">{group.detail}</p>
      </motion.div>

      <motion.ul
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={groupVariants}
        className={cn(
          'grid grid-cols-1 gap-4',
          REST_COLUMNS[group.features.length - 1] ?? DEFAULT_REST_COLUMNS,
        )}
      >
        {group.features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            isFeatured={index === 0}
          />
        ))}
      </motion.ul>
    </section>
  );
};

FeatureSection.displayName = 'FeatureSection';

export { FeatureSection };
