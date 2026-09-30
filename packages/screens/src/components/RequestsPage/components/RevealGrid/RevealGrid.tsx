import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import type { RevealGridProps } from './RevealGrid.types';

/**
 * A grid of things to ask for whose tiles arrive one after another rather than all at once, the way
 * the rails above them do. Each tile is a `RevealItem`, which carries its own place in the order.
 *
 * @param label - What the grid holds, for anybody who cannot see it.
 * @param children - The tiles, each wrapped in a `RevealItem`.
 */
const RevealGrid = ({ label, children }: RevealGridProps) => (
  <motion.ul
    aria-label={label}
    variants={groupVariants}
    initial="hidden"
    animate="shown"
    className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  >
    {children}
  </motion.ul>
);

RevealGrid.displayName = 'RevealGrid';

export { RevealGrid };
