import { motion } from 'motion/react';
import { staggerVariants } from '@ValenceUI/animations/reveal';
import type { DialogHeadlineProps } from './DialogHeadline.types';

/**
 * The words laid over a dialog's artwork — what it is, its title, the line of facts beneath — which
 * arrive one after another as the dialog opens rather than all at once. Each of its parts is a
 * `DialogHeadlinePart`, which is what rises; this only sets them going in order.
 *
 * @param children - The parts, in the order they should arrive.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogHeadline = ({ children, className }: DialogHeadlineProps) => (
  <motion.div variants={staggerVariants} initial="hidden" animate="shown" className={className}>
    {children}
  </motion.div>
);

DialogHeadline.displayName = 'DialogHeadline';

export { DialogHeadline };
