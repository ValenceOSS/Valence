import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { isMouseWheel } from '@ValenceUI/isMouseWheel';
import { FramedPicture } from '@ValenceUI/FramedPicture';
import { movedFrame } from '@ValenceCore/pictures/movedFrame';
import { zoomedFrame } from '@ValenceCore/pictures/zoomedFrame';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';
import type { PictureFramerProps } from './PictureFramer.types';

const WHEEL_ZOOM_PER_PIXEL = 0.002;

const PINCH_ZOOM_PER_PIXEL = 0.01;

const PIXELS_A_LINE = 16;

const KEY_STEP = 0.05;

const WINDOW_TALL = 0.8;

const WINDOW_WIDE = 0.9;

const KEY_ZOOM = 1.1;

const KEY_MOVES: Readonly<Partial<Record<string, { x: number; y: number }>>> = {
  ArrowLeft: { x: 1, y: 0 },
  ArrowRight: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
};

const KEY_ZOOMS: Readonly<Partial<Record<string, number>>> = {
  '+': KEY_ZOOM,
  '=': KEY_ZOOM,
  '-': 1 / KEY_ZOOM,
  _: 1 / KEY_ZOOM,
};

/**
 * A picture to be placed in its shape by hand: the shape sits in the middle of a stage, with the rest
 * of the picture faded around it so what could be brought in is in view. The picture is dragged, or
 * moved with two fingers on a trackpad, to choose which part shows; it is drawn nearer or further
 * with a pinch, a mouse wheel, or the plus and minus keys, and moved with the arrow keys.
 *
 * @param src - Where the picture is.
 * @param frame - Where it sits now.
 * @param aspect - How wide its shape is for its height.
 * @param tone - The filter it is drawn in.
 * @param mostZoom - The nearest it may be drawn.
 * @param label - What a reader is told it is.
 * @param shape - Whether it is seen through a circle or a rounded box.
 * @param className - The stage's size and place, which the shape is fitted inside.
 * @param onFrame - Told where it sits each time it moves.
 */
const PictureFramer = ({
  src,
  frame,
  aspect,
  tone = null,
  mostZoom,
  label,
  shape = 'rounded',
  onFrame,
  className,
}: PictureFramerProps) => {
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(frame);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ apart: number; zoom: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [isHeld, setIsHeld] = useState(false);
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const element = box.current;

    if (element === null) {
      return;
    }

    const measure = () => {
      setStage({ width: element.clientWidth, height: element.clientHeight });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const watching = new ResizeObserver(measure);

    watching.observe(element);

    return () => {
      watching.disconnect();
    };
  }, []);

  const across =
    stage === null || stage.width === 0 || stage.height === 0
      ? null
      : Math.min(stage.width * WINDOW_WIDE, stage.height * WINDOW_TALL * aspect);

  useEffect(() => {
    latest.current = frame;
  }, [frame]);

  const place = (next: PictureFrame) => {
    latest.current = next;
    onFrame(next);
  };

  const zoomTo = (zoom: number) => {
    if (size !== null) {
      place(zoomedFrame(latest.current, zoom, size, aspect, mostZoom));
    }
  };

  useEffect(() => {
    const element = box.current;

    if (element === null || size === null) {
      return;
    }

    const wheel = (event: WheelEvent) => {
      event.preventDefault();

      const isPinch = event.ctrlKey || event.metaKey;
      const isWheel = isMouseWheel(event);

      if (isPinch || isWheel) {
        const lines = event.deltaMode === 0 ? 1 : PIXELS_A_LINE;

        place(
          zoomedFrame(
            latest.current,
            latest.current.zoom *
              Math.exp(
                -event.deltaY * lines * (isPinch ? PINCH_ZOOM_PER_PIXEL : WHEEL_ZOOM_PER_PIXEL),
              ),
            size,
            aspect,
            mostZoom,
          ),
        );

        return;
      }

      if (across !== null) {
        place(
          movedFrame(
            latest.current,
            { x: -event.deltaX / across, y: (-event.deltaY / across) * aspect },
            size,
            aspect,
          ),
        );
      }
    };

    element.addEventListener('wheel', wheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', wheel);
    };
  });

  const apartOf = () => {
    const [first, second] = [...touches.current.values()];

    return first === undefined || second === undefined
      ? null
      : Math.hypot(first.x - second.x, first.y - second.y);
  };

  const press = (event: PointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setIsHeld(true);

    const apart = apartOf();

    pinch.current = apart === null || apart <= 0 ? null : { apart, zoom: latest.current.zoom };
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const was = touches.current.get(event.pointerId);

    if (was === undefined || size === null) {
      return;
    }

    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const apart = apartOf();

    if (pinch.current !== null && apart !== null) {
      zoomTo(pinch.current.zoom * (apart / pinch.current.apart));

      return;
    }

    if (across !== null) {
      place(
        movedFrame(
          latest.current,
          {
            x: (event.clientX - was.x) / across,
            y: ((event.clientY - was.y) / across) * aspect,
          },
          size,
          aspect,
        ),
      );
    }
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    touches.current.delete(event.pointerId);
    pinch.current = null;
    setIsHeld(touches.current.size > 0);
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = KEY_MOVES[event.key];
    const zoom = KEY_ZOOMS[event.key];
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;

    if (size === null || (move === undefined && zoom === undefined)) {
      return;
    }

    event.preventDefault();

    if (move !== undefined) {
      place(movedFrame(latest.current, { x: move.x * step, y: move.y * step }, size, aspect));
    }

    if (zoom !== undefined) {
      zoomTo(latest.current.zoom * zoom);
    }
  };

  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'relative touch-none select-none overflow-hidden rounded-lg bg-subtle outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary',
        isHeld ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
      onPointerDown={press}
      onPointerMove={drag}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={key}
    >
      {across === null ? null : (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: across, height: across / aspect }}
        >
          <FramedPicture
            src={src}
            frame={frame}
            aspect={aspect}
            tone={tone === null ? null : { ...tone, layer: null }}
            className="opacity-30"
          />
          <div
            className={cn(
              'absolute inset-0 isolate overflow-hidden ring-2 ring-on-scrim/80',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg',
            )}
          >
            <FramedPicture
              src={src}
              frame={frame}
              aspect={aspect}
              tone={tone}
              onMeasure={setSize}
            />
          </div>
        </div>
      )}
    </div>
  );
};

PictureFramer.displayName = 'PictureFramer';

export { PictureFramer };
