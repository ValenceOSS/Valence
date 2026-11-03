import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { IsInDialogSections } from './IsInDialogSections';
import { AreSectionsOpen } from './AreSectionsOpen';
import type { DialogSectionsProps } from './DialogSections.types';

const SECTIONS_ARRIVE: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

/**
 * The stack of panels below a dialog's artwork, which come in one after another once the headline
 * has begun to arrive, so the dialog assembles from the top down. Each `DialogSection` inside it is
 * what rises; anything else in the stack simply appears.
 *
 * @param children - The sections, in reading order.
 * @param isOpen - Whether each section stands open on the dialog under a heading of its own, as a
 *   title's dialog lays them out, rather than in a panel.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogSections = ({ children, isOpen = false, className }: DialogSectionsProps) => (
  <IsInDialogSections.Provider value>
    <AreSectionsOpen.Provider value={isOpen}>
      <motion.div variants={SECTIONS_ARRIVE} initial="hidden" animate="shown" className={className}>
        {children}
      </motion.div>
    </AreSectionsOpen.Provider>
  </IsInDialogSections.Provider>
);

DialogSections.displayName = 'DialogSections';

export { DialogSections };
