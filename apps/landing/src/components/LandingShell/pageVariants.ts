import type { Variants } from 'motion/react';

const SETTLE = [0.22, 1, 0.36, 1] as const;

/**
 * Builds how one page gives way to the next: the old one lifts a little and blurs away quickly, and
 * the new one rises out of a blur into focus, slower, so the change reads as one movement. Whoever
 * asked for less motion sees one fade into the other and nothing else.
 *
 * @param isStill - Whether the visitor asked for less motion.
 * @returns The page's hidden, shown and gone states.
 */
const pageVariants = (isStill: boolean): Variants =>
  isStill
    ? {
        hidden: { opacity: 0 },
        shown: { opacity: 1, transition: { duration: 0.2 } },
        gone: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.985, filter: 'blur(14px)' },
        shown: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          transition: { duration: 0.6, ease: SETTLE },
          transitionEnd: { filter: 'none' },
        },
        gone: {
          opacity: 0,
          y: -14,
          scale: 0.99,
          filter: 'blur(10px)',
          transition: { duration: 0.24, ease: 'easeIn' },
        },
      };

export { pageVariants };
