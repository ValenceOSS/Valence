import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import type { DialogHeadlinePartProps } from './DialogHeadlinePart.types';

const ELEMENTS = { div: motion.div, h2: motion.h2, span: motion.span } as const;

/**
 * One part of a dialog's headline, rising into place in its turn, or fading for somebody who asked
 * for less movement. The title arrives on the heavier spring a large thing uses, so a logo or a name
 * settles rather than snaps.
 *
 * @param children - What arrives.
 * @param as - Which element it is, so a title is still a heading.
 * @param isTitle - Whether this is the title, which arrives on the heavier spring.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogHeadlinePart = ({
  children,
  as = 'div',
  isTitle = false,
  className,
}: DialogHeadlinePartProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const Element = ELEMENTS[as];

  return (
    <Element
      variants={revealVariants(prefersReducedMotion)}
      transition={revealTransition(prefersReducedMotion, isTitle ? 'heavy' : 'light')}
      className={className}
    >
      {children}
    </Element>
  );
};

DialogHeadlinePart.displayName = 'DialogHeadlinePart';

export { DialogHeadlinePart };
