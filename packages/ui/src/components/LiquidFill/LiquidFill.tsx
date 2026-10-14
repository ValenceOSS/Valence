import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { drawLiquid } from './drawLiquid';
import { stepLiquid } from './stepLiquid';
import type { LiquidFillProps, LiquidState } from './LiquidFill.types';

const POINTS = 16;

/**
 * A level drawn as liquid in whatever holds it: water that ripples, sloshes when the level moves
 * and never quite stills, rather than a bar. It owns its canvas and the little simulation behind
 * it, which runs only while it is on screen and stands still for anybody who asked for less
 * motion.
 *
 * The surface carries a swell of crossing waves, so it never pivots about one point, and a change
 * of level splashes it at a random spot, the ripple spreading out from there.
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
    seconds: 0,
    phases: Array.from({ length: 6 }, () => Math.random() * 2 * Math.PI),
    swell: Array.from({ length: POINTS }, () => 0),
    backSwell: Array.from({ length: POINTS }, () => 0),
  });
  const prefersReducedMotion = useReducedMotionConfig() === true;

  useEffect(() => {
    const was = targetRef.current;
    const state = stateRef.current;
    const canvas = canvasRef.current;
    const splash = (was - level) * (canvas?.height ?? 40) * 0.25;

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

    const at = Math.floor(Math.random() * POINTS);

    state.speeds[at] = (state.speeds[at] ?? 0) + splash;
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
