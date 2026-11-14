import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { SpanStrip } from './components/SpanStrip/SpanStrip';
import { cn } from '@ValenceUI/cn';
import type { ChosenSpan, SpanPickerProps } from './SpanPicker.types';

const TICKS = 6;

type Hold = { part: 'move' | 'start' | 'end'; x: number; from: ChosenSpan; width: number };

const HANDLE = [
  'absolute top-1/2 h-6 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-text-muted',
  'transition-colors duration-[var(--duration-fast)] hover-hover:hover:bg-text',
].join(' ');

/**
 * A strip of every reading drawn small, with a window over the part a chart above it shows: dragged
 * to move along, pulled at either end to take in more or less, or pressed anywhere outside it to
 * bring it there. Arrow keys move it a tenth of its width at a time. The window keeps to whole
 * readings and never closes up smaller than the least it is allowed.
 *
 * @param values - Every reading, oldest first.
 * @param ceiling - The top of the scale they are drawn against.
 * @param span - The readings the window holds, by their places.
 * @param onSpanChange - Told whenever the window moves or changes size.
 * @param label - What the window chooses, read out to anybody who cannot see it.
 * @param tickOf - What to call a reading, for the marks beneath the strip.
 * @param leastSpan - The fewest readings the window may hold.
 * @param className - Extra classes for the caller's own layout.
 */
const SpanPicker = ({
  values,
  ceiling,
  span,
  onSpanChange,
  label,
  tickOf,
  leastSpan = 2,
  className,
}: SpanPickerProps) => {
  const strip = useRef<HTMLDivElement>(null);
  const hold = useRef<Hold | null>(null);
  const last = Math.max(values.length - 1, 1);
  const length = span.end - span.start;

  const change = (next: ChosenSpan) => {
    if (next.start !== span.start || next.end !== span.end) {
      onSpanChange(next);
    }
  };

  const begin = (part: Hold['part']) => (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    hold.current = {
      part,
      x: event.clientX,
      from: span,
      width: strip.current?.getBoundingClientRect().width ?? 1,
    };
  };

  const follow = (event: PointerEvent<HTMLElement>) => {
    const held = hold.current;

    if (held === null) {
      return;
    }

    const moved = Math.round(((event.clientX - held.x) / Math.max(held.width, 1)) * last);
    const { start, end } = held.from;

    if (held.part === 'move') {
      const shift = Math.min(Math.max(moved, -start), last - end);

      change({ start: start + shift, end: end + shift });
    } else if (held.part === 'start') {
      change({ start: Math.min(Math.max(start + moved, 0), end - leastSpan), end });
    } else {
      change({ start, end: Math.max(Math.min(end + moved, last), start + leastSpan) });
    }
  };

  const letGo = () => {
    hold.current = null;
  };

  const bringTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = strip.current?.getBoundingClientRect();

    if (box === undefined) {
      return;
    }

    const at = Math.round(((event.clientX - box.left) / Math.max(box.width, 1)) * last);
    const start = Math.min(Math.max(at - Math.round(length / 2), 0), last - length);

    change({ start, end: start + length });
  };

  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = Math.max(1, Math.round(length / 10));
    const by = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;

    if (by === 0) {
      return;
    }

    event.preventDefault();

    const shift = Math.min(Math.max(by, -span.start), last - span.end);

    change({ start: span.start + shift, end: span.end + shift });
  };

  const ticks = Array.from({ length: TICKS }, (_, at) => Math.round((at / (TICKS - 1)) * last));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        ref={strip}
        className="relative h-12 touch-none select-none overflow-hidden rounded-xl bg-[var(--surface-line)]/40"
        onPointerDown={bringTo}
      >
        <SpanStrip values={values} ceiling={ceiling} />

        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={last}
          aria-valuenow={span.start}
          className={cn(
            'absolute inset-y-0.5 cursor-grab rounded-[0.65rem] border-2 border-text-muted/70 bg-text/[0.07]',
            'outline-none focus-visible:border-text active:cursor-grabbing',
          )}
          style={{
            left: `${((span.start / last) * 100).toString()}%`,
            width: `${((length / last) * 100).toString()}%`,
          }}
          onPointerDown={begin('move')}
          onPointerMove={follow}
          onPointerUp={letGo}
          onPointerCancel={letGo}
          onKeyDown={nudge}
        >
          <span
            aria-hidden
            className={cn(HANDLE, '-start-1')}
            onPointerDown={begin('start')}
            onPointerMove={follow}
            onPointerUp={letGo}
            onPointerCancel={letGo}
          />
          <span
            aria-hidden
            className={cn(HANDLE, '-end-1')}
            onPointerDown={begin('end')}
            onPointerMove={follow}
            onPointerUp={letGo}
            onPointerCancel={letGo}
          />
        </div>
      </div>

      {tickOf === undefined ? null : (
        <div aria-hidden className="flex justify-between px-1">
          {ticks.map((at) => (
            <span
              key={at}
              className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-text-muted tabular-nums"
            >
              {tickOf(at)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

SpanPicker.displayName = 'SpanPicker';

export { SpanPicker };
