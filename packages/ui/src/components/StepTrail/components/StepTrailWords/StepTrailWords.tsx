import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { settleTween } from '@ValenceUI/animations/reveal';
import type { StepTrailWordsProps } from './StepTrailWords.types';

/**
 * A few words in a step of a trail that change in place: when they become other words the old ones
 * slide up and away as the new ones rise in under them, rather than the step being drawn afresh.
 *
 * @param children - The words.
 * @param className - Extra classes for the words themselves.
 */
const StepTrailWords = ({ children, className }: StepTrailWordsProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <span className="relative inline-grid min-w-0 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          initial={{ y: isStill ? 0 : '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isStill ? 0 : '-100%', opacity: 0 }}
          transition={isStill ? { duration: 0 } : settleTween}
          className={cn('col-start-1 row-start-1 truncate', className)}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

StepTrailWords.displayName = 'StepTrailWords';

export { StepTrailWords };
