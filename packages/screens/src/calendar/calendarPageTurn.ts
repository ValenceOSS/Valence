import { spring, stillTransition } from '@ValenceUI/animations/reveal';
import type { Variants } from 'motion/react';

const SHIFT = 48;

const LIFT = 10;

/**
 * Builds how one page of the calendar gives way to the next: sliding in from the side it was turned
 * towards and out of the other, or rising into place when the view changes rather than the page.
 * For somebody who asked for less motion it only fades.
 *
 * @param prefersReducedMotion - What the system reports, which is null until it has been read.
 * @returns The variants to hand a Motion component, which take the direction turned: -1 back, 1 on,
 *   0 for a change of view.
 */
const calendarPageTurn = (prefersReducedMotion: boolean | null): Variants =>
  prefersReducedMotion === true
    ? {
        enter: { opacity: 0 },
        centre: { opacity: 1, transition: stillTransition },
        leave: { opacity: 0, transition: stillTransition },
      }
    : {
        enter: (direction: number) => ({
          opacity: 0,
          x: direction * SHIFT,
          y: direction === 0 ? LIFT : 0,
        }),
        centre: { opacity: 1, x: 0, y: 0, transition: spring },
        leave: (direction: number) => ({
          opacity: 0,
          x: direction * -SHIFT,
          y: 0,
          transition: { duration: 0.14, ease: 'easeIn' },
        }),
      };

export { calendarPageTurn };
