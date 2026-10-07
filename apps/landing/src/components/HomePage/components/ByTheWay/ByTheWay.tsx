import { motion, useReducedMotionConfig } from 'motion/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ByTheWayProps } from './ByTheWay.types';

const POP = { type: 'spring', stiffness: 380, damping: 14 } as const;

/**
 * A note scribbled into the empty space beside something on the page: a fact about Valence worth
 * knowing in passing, written by hand in capitals with a little drawing under it, tipped a touch
 * off level. It pops in as it is reached, unless stillness was asked for.
 *
 * @param drawing - What is drawn under the note.
 * @param children - What the note says, after "by the way".
 * @param className - Where it sits and from what width it shows, which the section around it
 *   decides, since only it knows where the empty space is.
 */
const ByTheWay = ({ drawing, children, className }: ByTheWayProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <motion.div
      initial={isStill ? false : { opacity: 0, scale: 0.4, rotate: -18 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={isStill ? { duration: 0 } : POP}
      className={cn('pointer-events-none absolute z-10 w-64', className)}
    >
      <span className="block font-pen text-[1.85rem] uppercase leading-[0.95] text-accent">
        <span className="block">By the way...</span>
        {children}
      </span>
      <span className="mt-3 block rotate-6 text-accent">
        <Icon of={drawing} size={56} />
      </span>
    </motion.div>
  );
};

ByTheWay.displayName = 'ByTheWay';

export { ByTheWay };
