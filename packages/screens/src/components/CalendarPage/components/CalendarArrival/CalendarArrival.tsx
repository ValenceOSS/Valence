import { motion, useReducedMotionConfig } from 'motion/react';
import { popSpring, spring, stillTransition } from '@ValenceUI/animations/reveal';
import type { CalendarArrivalProps } from './CalendarArrival.types';

/**
 * Wraps one entry of a list on the release calendar so it pops into place after the given wait,
 * shrinks away when a filter takes it out, and slides when the entries around it come and go.
 *
 * @param children - The entry.
 * @param delay - How long it waits before arriving, in seconds.
 * @param className - Extra classes for the caller's own layout.
 */
const CalendarArrival = ({ children, delay = 0, className }: CalendarArrivalProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <motion.li
      layout={isStill ? false : 'position'}
      initial={isStill ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        isStill
          ? { opacity: 0, transition: stillTransition }
          : { opacity: 0, scale: 0.9, transition: { duration: 0.12, ease: 'easeIn' } }
      }
      transition={isStill ? stillTransition : { ...popSpring, delay, layout: spring }}
      className={className}
    >
      {children}
    </motion.li>
  );
};

CalendarArrival.displayName = 'CalendarArrival';

export { CalendarArrival };
