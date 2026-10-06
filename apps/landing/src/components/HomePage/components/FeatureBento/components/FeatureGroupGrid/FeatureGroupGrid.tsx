import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { FeatureCard } from '@ValenceLanding/components/HomePage/components/FeatureCard/FeatureCard';
import type { FeatureGroupGridProps } from './FeatureGroupGrid.types';

/**
 * One group of features — Viewing, Sharing, and so on — its number, name and a line about it over
 * a ruled grid of its cells, which arrive one after another as it scrolls in. A group of four
 * goes four across on a wide screen and two by two below it; a group of three goes three across,
 * and on a narrow screen its last cell takes the whole row.
 *
 * @param group - The group's title, its one-line description, and its features.
 * @param number - Where the group comes on the page.
 */
const FeatureGroupGrid = ({ group, number }: FeatureGroupGridProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isFour = group.features.length === 4;

  return (
    <section aria-label={group.title} className="flex flex-col gap-8">
      <motion.header
        initial="hidden"
        whileInView="shown"
        animate="hidden"
        viewport={{ margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-10"
      >
        <h3 className="flex items-baseline gap-4 text-3xl font-semibold tracking-tight text-text lg:text-4xl">
          <span className="text-base font-medium tabular-nums text-accent">
            {number.toString().padStart(2, '0')}
          </span>
          {group.title}
        </h3>
        <p className="max-w-md text-balance text-text-muted sm:text-right">{group.detail}</p>
      </motion.header>

      <div className="overflow-hidden">
        <motion.ul
          initial="hidden"
          whileInView="shown"
          animate="hidden"
          viewport={{ margin: '-80px' }}
          variants={groupVariants}
          className={cn(
            '-mb-px -mr-px grid grid-cols-1 sm:grid-cols-2',
            isFour
              ? '2xl:grid-cols-4'
              : 'lg:grid-cols-3 sm:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1',
          )}
        >
          {group.features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </motion.ul>
      </div>
    </section>
  );
};

FeatureGroupGrid.displayName = 'FeatureGroupGrid';

export { FeatureGroupGrid };
