import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { SpectrumBarsProps } from './SpectrumBars.types';

const BARS = 56;

const ATTACK = 0.55;

const RELEASE = 0.09;

const RESTING = 0.004;

const GAP = 0.4;

const ALPHA = 0.5;

/**
 * A row of bars rising and falling with the sound, drawn along the foot of whatever it sits behind.
 *
 * Each frame it asks the caller how loud every bar is and moves toward the answer — quickly up,
 * slowly down, so a beat lands hard and fades rather than flickering. Once what is playing stops it
 * lets the bars settle to nothing and then stops drawing altogether, and where somebody has asked
 * for less movement it draws nothing.
 *
 * @param read - Told how many bars are wanted, answers each one's height from nothing to one.
 * @param isPlaying - Whether there is sound to show, which is when it keeps drawing.
 * @param bars - How many bars to draw.
 * @param className - Extra classes for the caller's own layout; the bars take the text colour.
 */
const SpectrumBars = ({ read, isPlaying, bars = BARS, className }: SpectrumBarsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shownRef = useRef(new Float32Array(0));
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null || isStill) {
      return;
    }

    const context = canvas.getContext('2d');

    if (context === null) {
      return;
    }

    if (shownRef.current.length !== bars) {
      shownRef.current = new Float32Array(bars);
    }

    const shown = shownRef.current;
    const ink = getComputedStyle(canvas).color;

    let width = 0;
    let height = 0;
    let request = 0;

    const fit = () => {
      const ratio = Math.min(window.devicePixelRatio, 2);

      width = canvas.clientWidth;
      height = canvas.clientHeight;

      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const heard = isPlaying ? read(bars) : [];
      const slot = width / bars;
      const thickness = slot * (1 - GAP);

      let isLit = false;

      context.clearRect(0, 0, width, height);
      context.fillStyle = ink;
      context.globalAlpha = ALPHA;

      for (let bar = 0; bar < bars; bar += 1) {
        const target = heard[bar] ?? 0;
        const current = shown[bar] ?? 0;
        const next = current + (target - current) * (target > current ? ATTACK : RELEASE);

        shown[bar] = next;

        if (next > RESTING) {
          isLit = true;

          const tall = next * height;

          context.fillRect(bar * slot + (slot - thickness) / 2, height - tall, thickness, tall);
        }
      }

      request = isLit || isPlaying ? requestAnimationFrame(draw) : 0;
    };

    fit();

    const watcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);

    watcher?.observe(canvas);
    request = requestAnimationFrame(draw);

    return () => {
      watcher?.disconnect();
      cancelAnimationFrame(request);
    };
  }, [read, isPlaying, bars, isStill]);

  return <canvas ref={canvasRef} aria-hidden className={cn('block w-full', className)} />;
};

SpectrumBars.displayName = 'SpectrumBars';

export { SpectrumBars };
