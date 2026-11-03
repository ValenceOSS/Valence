import { useContext } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { IsInDialogSections } from '@ValenceScreens/components/DialogSections/IsInDialogSections';
import { AreSectionsOpen } from '@ValenceScreens/components/DialogSections/AreSectionsOpen';
import { Well } from '@ValenceUI/Well';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import type { DialogSectionProps } from './DialogSection.types';

/**
 * One section of a dialog below its artwork — a synopsis, a cast, a list of chapters — set in a panel
 * of its own with its heading in small capitals inside it, so a dialog reads as a stack of cards
 * rather than as text running down the page. A section whose content brings its own heading, such as
 * a row with arrows beside its title, leaves the heading out and lets the content head it.
 *
 * Among sections that stand open it has no panel, only a heading over what it holds.
 *
 * Inside a `DialogSections` it rises into place in its turn as the dialog opens; anywhere else it is
 * simply there. It only takes part in an animation it was placed inside on purpose: a dialog opens
 * within the page, and a panel that listened to whatever the page was doing would be hidden whenever
 * the page happened to be.
 *
 * @param heading - What the section is, drawn at its top.
 * @param children - What goes in it.
 * @param className - Extra classes for the panel's own layout.
 */
const DialogSection = ({ heading, children, className }: DialogSectionProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isArriving = useContext(IsInDialogSections);

  const isOpen = useContext(AreSectionsOpen);

  const panel = isOpen ? (
    <div className={cn('flex flex-col gap-4', className)}>
      {heading === undefined ? null : <h3 className={RAIL.title}>{heading}</h3>}

      {children}
    </div>
  ) : (
    <Well className={cn('flex flex-col gap-3', className)}>
      {heading === undefined ? null : <h3 className={RAIL.sectionTitle}>{heading}</h3>}

      {children}
    </Well>
  );

  return isArriving ? (
    <motion.section
      variants={revealVariants(prefersReducedMotion)}
      transition={revealTransition(prefersReducedMotion)}
      {...(heading === undefined ? {} : { 'aria-label': heading })}
    >
      {panel}
    </motion.section>
  ) : (
    <section {...(heading === undefined ? {} : { 'aria-label': heading })}>{panel}</section>
  );
};

DialogSection.displayName = 'DialogSection';

export { DialogSection };
