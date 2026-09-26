import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { showOrb } from '@ValenceUI/orbs/showOrb';
import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbProps } from './Orb.types';

const STANDARD: OrbLook = { params: {}, colours: {} };

/**
 * One of the shader orbs, drawn live in a round frame and filling whatever box it is given.
 *
 * Its settings are read at every frame rather than when it was drawn, so dragging a slider moves
 * the orb as it goes instead of starting it again. Where movement has been turned down it is drawn
 * once and held still.
 *
 * @param variant - Which orb.
 * @param look - Its settings; each one left out is the orb's own.
 * @param label - What a screen reader says it is, where it is not only decoration.
 * @param isStill - Whether to hold it still even where movement is allowed.
 * @param className - Extra classes for the caller's own layout.
 */
const Orb = ({ variant, look = STANDARD, label, isStill = false, className }: OrbProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(look);
  const redraw = useRef<(() => void) | null>(null);
  const prefersReducedMotion = useReducedMotionConfig();
  const holdsStill = isStill || prefersReducedMotion === true;

  useEffect(() => {
    latest.current = look;
    redraw.current?.();
  }, [look]);

  useEffect(() => {
    if (canvas.current === null) {
      return undefined;
    }

    const shown = showOrb(canvas.current, variant, () => latest.current, { isStill: holdsStill });

    redraw.current = shown.redraw;

    return () => {
      redraw.current = null;
      shown.stop();
    };
  }, [variant, holdsStill]);

  return (
    <canvas
      ref={canvas}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn('block aspect-square rounded-full', className)}
    />
  );
};

Orb.displayName = 'Orb';

export { Orb };
