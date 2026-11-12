import { useEffect, useRef, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { FramedPicture } from '@ValenceUI/FramedPicture';
import { movedFrame } from '@ValenceCore/pictures/movedFrame';
import { zoomedFrame } from '@ValenceCore/pictures/zoomedFrame';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';
import type { PictureFramerProps } from './PictureFramer.types';

const WHEEL_ZOOM_PER_PIXEL = 0.002;

const KEY_STEP = 0.05;

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
 * A picture to be placed in its shape by hand: dragged to choose which part shows, drawn nearer or
 * further with a scroll, a pinch, or the plus and minus keys, and moved with the arrow keys.
 *
 * @param src - Where the picture is.
 * @param frame - Where it sits now.
 * @param aspect - How wide its shape is for its height.
 * @param mostZoom - The nearest it may be drawn.
 * @param label - What a reader is told it is.
 * @param shape - Whether it is seen through a circle or a rounded box.
 * @param onFrame - Told where it sits each time it moves.
 */
const PictureFramer = ({
  src,
  frame,
  aspect,
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
      place(
        zoomedFrame(
          latest.current,
          latest.current.zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_PER_PIXEL),
          size,
          aspect,
          mostZoom,
        ),
      );
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

    pinch.current = apart === null ? null : { apart, zoom: latest.current.zoom };
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

    const { width, height } = event.currentTarget.getBoundingClientRect();

    if (width > 0 && height > 0) {
      place(
        movedFrame(
          latest.current,
          { x: (event.clientX - was.x) / width, y: (event.clientY - was.y) / height },
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
      style={{ aspectRatio: aspect }}
      className={cn(
        'relative touch-none select-none overflow-hidden bg-subtle outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary',
        isHeld ? 'cursor-grabbing' : 'cursor-grab',
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        className,
      )}
      onPointerDown={press}
      onPointerMove={drag}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={key}
    >
      <FramedPicture src={src} frame={frame} aspect={aspect} onMeasure={setSize} />
    </div>
  );
};

PictureFramer.displayName = 'PictureFramer';

export { PictureFramer };
