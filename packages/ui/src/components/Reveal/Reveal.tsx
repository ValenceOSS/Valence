import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import type { RevealProps } from './Reveal.types';

/**
 * Brings one block of a page in on its own, rising into place or fading for somebody who has asked
 * for less movement, once it is first shown.
 *
 * For the things that are not one of a row, so a title, a body or a panel arrives without being
 * dressed as a list item to do it. Give a page's parts a rising delay and they arrive in reading
 * order.
 *
 * @param children - What arrives.
 * @param delay - How long to wait before arriving, in seconds.
 * @param className - Extra classes for the caller's own layout.
 */
const Reveal = ({ children, delay = 0, className }: RevealProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.div
      initial="hidden"
      animate="shown"
      variants={revealVariants(prefersReducedMotion)}
      transition={{ ...revealTransition(prefersReducedMotion, 'heavy'), delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

Reveal.displayName = 'Reveal';

export { Reveal };
