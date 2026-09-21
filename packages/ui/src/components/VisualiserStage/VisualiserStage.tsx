import { useEffect, useRef } from 'react';
import { cn } from '@ValenceUI/cn';
import type { VisualiserStageProps } from './VisualiserStage.types';

const LONGEST_FRAME_SECONDS = 0.1;

/**
 * A canvas that fills whatever it sits in and hands a caller a fresh frame to paint sixty times a
 * second, at the screen's own sharpness.
 *
 * The caller is told how big the canvas is, how long it has been running and how long the last frame
 * took, and paints onto the context however it likes. A frame that took longer than a tenth of a
 * second — a tab that was in the background — is counted as one so nothing leaps when it returns.
 *
 * @param draw - Paints one frame.
 * @param className - Extra classes for the caller's own layout.
 */
const VisualiserStage = ({ draw, className }: VisualiserStageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d') ?? null;

    if (canvas === null || context === null) {
      return;
    }

    let width = 0;
    let height = 0;
    let request = 0;
    let started = 0;
    let last = 0;

    const fit = () => {
      const ratio = Math.min(window.devicePixelRatio, 2);

      width = canvas.clientWidth;
      height = canvas.clientHeight;

      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const frame = (now: number) => {
      started = started === 0 ? now : started;

      const delta = last === 0 ? 0 : Math.min((now - last) / 1000, LONGEST_FRAME_SECONDS);

      last = now;

      draw(context, { width, height }, { seconds: (now - started) / 1000, delta });

      request = requestAnimationFrame(frame);
    };

    fit();

    const watcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);

    watcher?.observe(canvas);
    request = requestAnimationFrame(frame);

    return () => {
      watcher?.disconnect();
      cancelAnimationFrame(request);
    };
  }, [draw]);

  return <canvas ref={canvasRef} aria-hidden className={cn('block h-full w-full', className)} />;
};

VisualiserStage.displayName = 'VisualiserStage';

export { VisualiserStage };
