import { bounceSpring } from '@ValenceUI/animations/reveal';
import type { MotionProps } from 'motion/react';

const REST = { opacity: 1, y: 0, scale: 1 };

/**
 * How one day of the calendar arrives: rising into place from a little smaller after the given
 * wait, landing with a touch of overshoot. For somebody who asked for less motion it is simply
 * there.
 *
 * @param delay - How long it waits, in seconds.
 * @param isStill - Whether it should simply be there.
 * @returns The Motion props for the day.
 */
const calendarDayArrival = (
  delay: number,
  isStill: boolean,
): Pick<MotionProps, 'initial' | 'animate' | 'transition'> =>
  isStill
    ? { initial: false as const, animate: REST }
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: REST,
        transition: { ...bounceSpring, delay },
      };

export { calendarDayArrival };
