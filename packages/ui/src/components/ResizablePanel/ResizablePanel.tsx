import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { VALENCE_TOKENS } from '@ValenceUI/tokens';
import { drawStroke } from './drawStroke';
import { rubberBand } from './rubberBand';
import type { ResizablePanelProps, ResizePhase } from './ResizablePanel.types';

const STEP = 16;
const BEND_LIMIT = 10;
const BEND_PER_SPEED = 0.012;
const STILL_AFTER_MS = 60;
const DRAGGED = { length: 92, thickness: 4 };
const LET_GO = { length: 110, thickness: 2 };
const SPRING_BACK = { type: 'spring', stiffness: 380, damping: 30 } as const;
const BEND_SPRING = { stiffness: 520, damping: 14, mass: 0.6 };

/**
 * A panel whose leading or trailing edge can be dragged to make it wider or narrower. Pointed at, the edge shows
 * a pill to take hold of; held, the pill becomes a line that bows after the pointer the faster it
 * moves; pulled past either limit, the panel stretches a little further and springs back on letting
 * go, leaving a fine straight line that fades. The edge also answers the arrow keys, Home and End.
 *
 * Its width is also set as `--panel-width`, for something inside that sizes itself — a sidebar that
 * folds away, say — while the panel is told `w-auto` to follow it.
 *
 * @param label - What the edge resizes, read out to anybody who cannot see it.
 * @param defaultWidth - How wide it opens, in pixels.
 * @param minWidth - The narrowest it settles at.
 * @param maxWidth - The widest it settles at.
 * @param edge - Which side is dragged: the start for a panel on the right, the end for one on the
 *   left.
 * @param isDisabled - Whether the edge is out of reach, while the panel is folded away.
 * @param children - What the panel holds.
 * @param className - Extra classes for the caller's own layout.
 * @param onWidthChange - Told the width it settles at, each time it settles.
 */
const ResizablePanel = ({
  label,
  defaultWidth,
  minWidth,
  maxWidth,
  edge = 'start',
  isDisabled = false,
  children,
  className,
  onWidthChange,
}: ResizablePanelProps) => {
  const isStill = useReducedMotionConfig() === true;
  const width = useMotionValue(defaultWidth);
  const outward = edge === 'start' ? -1 : 1;
  const bendTarget = useMotionValue(0);
  const bend = useSpring(bendTarget, BEND_SPRING);
  const length = useMotionValue(DRAGGED.length);
  const thickness = useMotionValue(DRAGGED.thickness);
  const opacity = useMotionValue(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const held = useRef<{ x: number; width: number; lastX: number; lastTime: number } | null>(null);
  const stillTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gesture = useRef(0);
  const [phase, setPhase] = useState<ResizePhase>('resting');

  const settle = (next: number) => Math.min(maxWidth, Math.max(minWidth, Math.round(next)));

  const paint = () => {
    const canvas = canvasRef.current;
    const pen = canvas?.getContext('2d') ?? null;

    if (canvas === null || pen === null) {
      return;
    }

    const sharpness = window.devicePixelRatio;
    const across = canvas.clientWidth;
    const down = canvas.clientHeight;

    if (canvas.width !== Math.round(across * sharpness)) {
      canvas.width = Math.round(across * sharpness);
      canvas.height = Math.round(down * sharpness);
    }

    pen.setTransform(sharpness, 0, 0, sharpness, 0, 0);
    drawStroke(pen, across, down, getComputedStyle(canvas).color, {
      bend: bend.get(),
      length: length.get(),
      thickness: thickness.get(),
      opacity: opacity.get(),
    });
  };

  useMotionValueEvent(bend, 'change', paint);
  useMotionValueEvent(length, 'change', paint);
  useMotionValueEvent(thickness, 'change', paint);
  useMotionValueEvent(opacity, 'change', paint);

  const showWidth = (next: number) => {
    panelRef.current?.style.setProperty('--panel-width', `${next.toString()}px`);
  };

  useLayoutEffect(() => {
    panelRef.current?.style.setProperty('--panel-width', `${width.get().toString()}px`);
  }, [width]);

  useMotionValueEvent(width, 'change', (next) => {
    showWidth(next);
    edgeRef.current?.setAttribute('aria-valuenow', settle(next).toString());
  });

  useEffect(
    () => () => {
      clearTimeout(stillTimer.current);
    },
    [],
  );

  const goTo = (next: number) => {
    const target = settle(next);

    if (isStill) {
      width.set(target);
    } else {
      void animate(width, target, SPRING_BACK);
    }

    onWidthChange?.(target);
  };

  const takeHold = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    width.stop();
    gesture.current += 1;
    held.current = {
      x: event.clientX,
      width: width.get(),
      lastX: event.clientX,
      lastTime: event.timeStamp,
    };
    length.jump(DRAGGED.length);
    thickness.jump(DRAGGED.thickness);
    void animate(opacity, 1, { duration: isStill ? 0 : VALENCE_TOKENS.duration.fast });
    setPhase('dragging');
  };

  const pull = (event: PointerEvent<HTMLDivElement>) => {
    const hold = held.current;

    if (hold === null) {
      return;
    }

    width.set(rubberBand(hold.width + (event.clientX - hold.x) * outward, minWidth, maxWidth));

    const elapsed = Math.max(1, event.timeStamp - hold.lastTime);
    const speed = ((event.clientX - hold.lastX) / elapsed) * 1000;

    hold.lastX = event.clientX;
    hold.lastTime = event.timeStamp;

    if (!isStill) {
      bendTarget.set(Math.max(-BEND_LIMIT, Math.min(BEND_LIMIT, speed * BEND_PER_SPEED)));
      clearTimeout(stillTimer.current);
      stillTimer.current = setTimeout(() => {
        bendTarget.set(0);
      }, STILL_AFTER_MS);
    }
  };

  const letGo = () => {
    if (held.current === null) {
      return;
    }

    held.current = null;
    clearTimeout(stillTimer.current);
    bendTarget.set(0);
    goTo(width.get());
    setPhase('settling');

    const thisGesture = gesture.current;
    const fade = { duration: isStill ? 0 : VALENCE_TOKENS.duration.normal };

    void Promise.all([
      animate(length, LET_GO.length, { ...fade, ease: VALENCE_TOKENS.ease.soft }),
      animate(thickness, LET_GO.thickness, { ...fade, ease: VALENCE_TOKENS.ease.soft }),
    ])
      .then(() =>
        animate(opacity, 0, {
          duration: isStill ? 0 : VALENCE_TOKENS.duration.slow,
          delay: isStill ? 0 : VALENCE_TOKENS.duration.normal,
        }),
      )
      .then(() => {
        if (gesture.current === thisGesture) {
          setPhase('resting');
        }
      });
  };

  const press = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Partial<Record<string, number>> = {
      ArrowLeft: width.get() - STEP * outward,
      ArrowRight: width.get() + STEP * outward,
      Home: minWidth,
      End: maxWidth,
    };
    const next = moves[event.key];

    if (next !== undefined) {
      event.preventDefault();
      goTo(next);
    }
  };

  return (
    <div
      ref={panelRef}
      {...(phase === 'resting' ? {} : { 'data-resizing': '' })}
      className={cn('relative w-[var(--panel-width)] shrink-0', className)}
    >
      {children}

      <div
        ref={edgeRef}
        role="separator"
        aria-orientation="vertical"
        aria-label={label}
        aria-valuenow={settle(defaultWidth)}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        tabIndex={0}
        onPointerDown={takeHold}
        onPointerMove={pull}
        onPointerUp={letGo}
        onPointerCancel={letGo}
        onKeyDown={press}
        hidden={isDisabled}
        className={cn(
          'group absolute inset-y-0 z-20 flex w-4 cursor-col-resize touch-none items-center justify-center outline-none select-none',
          edge === 'start' ? '-left-2' : '-right-2',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-[76px] w-3.5 rounded-full bg-text-muted/45 opacity-0 ring-2 ring-[var(--card-face)]',
            'transition-opacity duration-150 ease-out motion-reduce:transition-none',
            phase === 'resting' ? 'group-hover:opacity-100 group-focus-visible:opacity-100' : '',
          )}
        />

        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-12 -translate-x-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    </div>
  );
};

ResizablePanel.displayName = 'ResizablePanel';

export { ResizablePanel };
