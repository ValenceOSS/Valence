import { useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import type { MotionProps } from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { takeArrivalPlace } from './takeArrivalPlace';
import type { ArrivalBatch } from './ArrivalBatch';

const LINE: ArrivalBatch = { size: 0, lastAt: -Infinity };

/**
 * Brings a block in the way the cards on the home screen arrive, rising and settling on a spring, in
 * line behind every other block that mounted alongside it — so a page of cards drawn at once comes in
 * one after another wherever on the page each is drawn, without any of them knowing about the rest.
 *
 * @param count - How many pieces this block brings in, each taking its own place in line.
 * @returns Something to ask, with a piece's index, for the Motion props that bring it in.
 */
const useMountArrival = (
  count = 1,
): ((at?: number) => Pick<MotionProps, 'custom' | 'variants' | 'initial' | 'animate'>) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [first] = useState(() => takeArrivalPlace(LINE, performance.now(), count));
  const variants = revealItemVariants(prefersReducedMotion);

  return (at = 0) => ({ custom: first + at, variants, initial: 'hidden', animate: 'shown' });
};

export { useMountArrival };
