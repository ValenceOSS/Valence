import { useEffect, useState } from 'react';
import type { DrawnWhenNearProps } from './DrawnWhenNear.types';

const NEAR = '300% 0px';

/**
 * Draws a block of a long page only while it is within a few screens of being seen, and in its place
 * otherwise keeps an empty space as tall as it was, so a page that goes on growing costs only what is
 * near the screen to draw again, and nothing moves when a block is put away or brought back.
 *
 * @param children - Draws the block, asked for only while it is near.
 * @param className - Extra classes for the caller's own layout.
 */
const DrawnWhenNear = ({ children, className }: DrawnWhenNearProps) => {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [farHeight, setFarHeight] = useState<number | null>(null);

  useEffect(() => {
    if (box === null || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const watching = new IntersectionObserver(
      ([entry]) => {
        if (entry === undefined) {
          return;
        }

        const { height } = entry.boundingClientRect;

        setFarHeight((held) => (entry.isIntersecting ? null : (held ?? height)));
      },
      { rootMargin: NEAR },
    );

    watching.observe(box);

    return () => {
      watching.disconnect();
    };
  }, [box]);

  return (
    <div
      ref={setBox}
      className={className}
      style={farHeight === null ? undefined : { height: farHeight }}
    >
      {farHeight === null ? children() : null}
    </div>
  );
};

DrawnWhenNear.displayName = 'DrawnWhenNear';

export { DrawnWhenNear };
