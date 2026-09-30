import { motion, useReducedMotionConfig } from 'motion/react';
import type { DialogArrivalProps } from './DialogArrival.types';

/**
 * Fades a dialog's content in as it opens, under the headline and sections rising in their turn, so
 * the artwork arrives softly rather than being there at once. Keyed by the caller to what it shows,
 * so moving from one title to another fades the new one in as well.
 *
 * @param children - The dialog's content.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogArrival = ({ children, className }: DialogArrivalProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion === true ? 0 : 0.35, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

DialogArrival.displayName = 'DialogArrival';

export { DialogArrival };
