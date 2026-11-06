import { useContext } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { snapRowContext } from '@ValenceUI/snapRowContext';
import type { RevealItemProps } from './RevealItem.types';

/**
 * Wraps one item of a row so it arrives after the ones before it, giving a row that assembles left
 * to right rather than appearing at once. The index rather than the position on screen decides the
 * wait, so a row that is scrolled still arrives in order.
 *
 * In a row that snaps to its cards, the item itself stays where it is and what it holds does the
 * arriving. A browser snaps to a card's box as it is drawn, so a card still growing into place
 * would have the row scroll a little to meet it and scroll back once it has landed — sliding in
 * one browser, jumping in another.
 *
 * @param children - The item.
 * @param index - Where it sits in the row, counting from zero.
 * @param className - Extra classes for the caller's own layout.
 */
const RevealItem = ({ children, index, className }: RevealItemProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isSnappedTo = useContext(snapRowContext);

  if (isSnappedTo) {
    return (
      <li className={className}>
        <motion.div
          custom={index}
          variants={revealItemVariants(prefersReducedMotion)}
          className="h-full"
        >
          {children}
        </motion.div>
      </li>
    );
  }

  return (
    <motion.li
      custom={index}
      variants={revealItemVariants(prefersReducedMotion)}
      className={className}
    >
      {children}
    </motion.li>
  );
};

RevealItem.displayName = 'RevealItem';

export { RevealItem };
