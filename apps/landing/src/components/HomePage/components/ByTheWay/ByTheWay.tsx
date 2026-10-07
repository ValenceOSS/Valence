import { motion, useReducedMotionConfig } from 'motion/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ByTheWayProps } from './ByTheWay.types';

const POP = { type: 'spring', stiffness: 380, damping: 14 } as const;

/**
 * A note scribbled into the empty space beside something on the page: a fact about Valence worth
 * knowing in passing, written by hand in capitals with a little drawing under it, tipped a touch
 * off level. It pops in each time it comes into view, unless stillness was asked for.
 *
 * @param lead - How it opens, which differs from note to note so they do not read as a form.
 * @param drawing - What is drawn under the note.
 * @param children - What the note says, after its opening.
 * @param footnote - A line set small beneath it, for the asterisk the note leans on.
 * @param isRightAligned - Whether it lines up on its right, for a note sitting to the left of what
 *   it is about or against the right of the page.
 * @param className - Where it sits and from what width it shows, which the section around it
 *   decides, since only it knows where the empty space is.
 */
const ByTheWay = ({
  lead,
  drawing,
  children,
  footnote,
  isRightAligned = false,
  className,
}: ByTheWayProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <motion.div
      initial={isStill ? false : { opacity: 0, scale: 0.4, rotate: -18 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
      viewport={{ amount: 0.8 }}
      transition={isStill ? { duration: 0 } : POP}
      className={cn(
        'pointer-events-none absolute z-10 w-64',
        isRightAligned ? 'text-right' : '',
        className,
      )}
    >
      <span className="block font-pen text-[1.85rem] uppercase leading-[0.95] text-accent">
        <span className="block">{lead}</span>
        {children}
      </span>
      {footnote === undefined ? null : (
        <span className="mt-1.5 block font-pen text-lg uppercase leading-none text-accent/70">
          {footnote}
        </span>
      )}
      <span className={cn('mt-3 flex rotate-6 text-accent', isRightAligned ? 'justify-end' : '')}>
        <Icon of={drawing} size={56} />
      </span>
    </motion.div>
  );
};

ByTheWay.displayName = 'ByTheWay';

export { ByTheWay };
