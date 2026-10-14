import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { drawLiquid } from './drawLiquid';
import { stepLiquid } from './stepLiquid';
import type { LiquidFillProps, LiquidState } from './LiquidFill.types';

const POINTS = 10;

/**
 * A level drawn as liquid in whatever holds it: water that ripples, sloshes when the level moves
 * and never quite stills, rather than a bar. It owns its canvas and the little simulation behind
 * it, which runs only while it is on screen and stands still for anybody who asked for less
 * motion.
 *
 * A change of level tips the surface as well as moving it — up on one side and down on the other —
 * so a figure that jumps reads as liquid poured or drained.
 *
 * @param level - How full it is, from nothing to full.
 * @param tone - Which of the theme's status colours the liquid is.
 * @param className - Extra classes for the caller's own layout.
 */
const LiquidFill = ({ level, tone, className }: LiquidFillProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(level);
  const stateRef = useRef<LiquidState>({
    level,
    levelSpeed: 0,
    heights: Array.from({ length: POINTS }, () => 0),
    speeds: Array.from({ length: POINTS }, () => 0),
    back: Array.from({ length: POINTS }, () => 0),
    backSpeeds: Array.from({ length: POINTS }, () => 0),
  });
  const prefersReducedMotion = useReducedMotionConfig() === true;

  useEffect(() => {
    const was = targetRef.current;
    const state = stateRef.current;
    const canvas = canvasRef.current;
    const tilt = (level - was) * (canvas?.height ?? 40) * 0.6;

    targetRef.current = level;

    if (prefersReducedMotion) {
      const context = canvas?.getContext('2d') ?? null;

      if (canvas !== null && context !== null) {
        state.level = level;
        drawLiquid(
          context,
          state,
          getComputedStyle(canvas).getPropertyValue(`--color-${tone}`).trim(),
          canvas.width,
          canvas.height,
        );
      }

      return;
    }

    state.speeds.forEach((speed, index) => {
      state.speeds[index] = speed + tilt * (index / (POINTS - 1) - 0.5);
    });
  }, [level, tone, prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d') ?? null;

    if (canvas === null || context === null) {
      return;
    }

    let colour = '';
    let frame = 0;
    let handle = 0;

    const fit = () => {
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    };

    const readColour = () => {
      colour = getComputedStyle(canvas).getPropertyValue(`--color-${tone}`).trim();
    };

    const sizing = new ResizeObserver(fit);

    sizing.observe(canvas);
    fit();
    readColour();

    if (prefersReducedMotion) {
      const state = stateRef.current;

      state.level = targetRef.current;
      state.heights.fill(0);
      state.back.fill(0);
      drawLiquid(context, state, colour, canvas.width, canvas.height);

      return () => {
        sizing.disconnect();
      };
    }

    const tick = () => {
      frame += 1;

      if (frame % 60 === 0) {
        readColour();
      }

      stepLiquid(stateRef.current, targetRef.current, canvas.height);
      drawLiquid(context, stateRef.current, colour, canvas.width, canvas.height);
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(handle);
      sizing.disconnect();
    };
  }, [tone, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
  );
};

LiquidFill.displayName = 'LiquidFill';

export { LiquidFill };
