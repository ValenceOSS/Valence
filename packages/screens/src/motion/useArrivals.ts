import { useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import type { MotionProps } from 'motion/react';

import { takeArrivalPlace } from './takeArrivalPlace';
import type { ArrivalBatch } from './ArrivalBatch';

/**
 * Lets a long grid bring its cards in one after another the first time each is drawn, and never
 * again. The first screenful staggers in; a page more, loaded as somebody scrolls, rises in behind it
 * in turn; and a card scrolled away and back — which a grid that only draws what is on screen draws
 * afresh — simply appears, because it has been seen. Cards are known by the key they are drawn under,
 * so narrowing the grid brings in only what is new to it.
 *
 * A card counts as seen once it has finished arriving, not once it has been drawn: a grid that lays
 * itself out again as it learns its width draws every card twice in its first moments, and the second
 * drawing is the one on screen. Each card keeps the place in line it was first given, so that second
 * drawing staggers exactly as the first would have; cards first asked about after a pause — the next
 * page arriving — start a line of their own.
 *
 * Ask it for a card's arrival while drawing, in the order the cards are laid out.
 *
 * @returns Something to ask, with a card's key, for the Motion props that bring it in.
 */
const useArrivals = (): ((
  key: string,
) => Pick<MotionProps, 'custom' | 'variants' | 'initial' | 'animate' | 'onAnimationComplete'>) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const seenRef = useRef(new Set<string>());
  const placesRef = useRef(new Map<string, number>());
  const batchRef = useRef<ArrivalBatch>({ size: 0, lastAt: -Infinity });

  return (key: string) => {
    const isNew = !seenRef.current.has(key);
    let place = placesRef.current.get(key);

    if (isNew && place === undefined) {
      place = takeArrivalPlace(batchRef.current, performance.now());
      placesRef.current.set(key, place);
    }

    return {
      custom: place ?? 0,
      variants: revealItemVariants(prefersReducedMotion),
      initial: isNew ? 'hidden' : false,
      animate: 'shown',
      onAnimationComplete: () => {
        seenRef.current.add(key);
      },
    };
  };
};

export { useArrivals };
