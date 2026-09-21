import { useState } from 'react';
import type { PointerEvent } from 'react';
import { cn } from '@ValenceUI/cn';
import type { TimeBarsProps } from './TimeBars.types';

const TICKS = 5;

/**
 * Which bar a pointer is over, from how far across the chart it is.
 *
 * @param event - The pointer event, from anywhere over the chart.
 * @param count - How many bars there are.
 * @returns The bar's place, held to the bars that exist.
 */
const barUnder = (event: PointerEvent<HTMLElement>, count: number): number => {
  const box = event.currentTarget.getBoundingClientRect();
  const share = box.width === 0 ? 0 : (event.clientX - box.left) / box.width;

  return Math.min(count - 1, Math.max(0, Math.floor(share * count)));
};

/**
 * A row of stacked bars over time, one per stretch of it, each stack split by series — how much
 * there was of each kind of thing, and when.
 *
 * Every bar shares one scale, set by the tallest, so a quiet stretch looks quiet. Resting the pointer
 * on a bar says when it was and how much of each series it holds; pressing on one, or dragging
 * across several, picks that stretch of time for the caller to zoom into. Drawn from plain elements
 * so it fills its container and follows the theme without a charting library.
 *
 * The picture is for looking at; anything it lets somebody do with a pointer is also available in
 * the caller's own controls, and the label says what it shows to anybody who cannot see it.
 *
 * @param bars - The stacks, earliest first.
 * @param series - What each stack is split into, bottom first.
 * @param bucketMs - How much time one bar covers.
 * @param label - What the chart shows, read out to anybody who cannot see it.
 * @param isCompact - Whether to draw only the bars, small, for a figure's background.
 * @param hasLegend - Whether to name each series beneath the chart, where the caller names them itself.
 * @param formatTick - Says a moment along the bottom.
 * @param formatSpan - Says the stretch of time a bar covers, in the tooltip.
 * @param onPickRange - Told which stretch of time was picked, where picking is allowed.
 * @param className - Extra classes for the caller's own layout.
 */
const TimeBars = ({
  bars,
  series,
  bucketMs,
  label,
  isCompact = false,
  hasLegend = true,
  formatTick,
  formatSpan,
  onPickRange,
  className,
}: TimeBarsProps) => {
  const [over, setOver] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const totals = bars.map((bar) =>
    series.reduce((sum, one) => sum + (bar.values[one.key] ?? 0), 0),
  );
  const tallest = Math.max(1, ...totals);
  const isPicking = onPickRange !== undefined && !isCompact;
  const shown = over === null ? null : bars[over];
  const span = dragFrom === null || over === null ? null : [dragFrom, over].sort((a, b) => a - b);
  const ticks = [
    ...new Set(
      Array.from({ length: Math.min(TICKS, bars.length) }, (_, tick) =>
        Math.round((tick / Math.max(1, Math.min(TICKS, bars.length) - 1)) * (bars.length - 1)),
      ),
    ),
  ];
  const first = bars[0];
  const last = bars[bars.length - 1];

  if (first === undefined || last === undefined) {
    return (
      <div className={cn('flex h-24 items-center justify-center', className)}>
        <p className="font-body text-xs text-text-muted">Nothing in this time.</p>
      </div>
    );
  }

  const finish = (event: PointerEvent<HTMLElement>) => {
    if (dragFrom === null || onPickRange === undefined) {
      return;
    }

    const [from, until] = [dragFrom, barUnder(event, bars.length)].sort((a, b) => a - b);
    const start = bars[from ?? 0];
    const end = bars[until ?? 0];

    setDragFrom(null);

    if (start !== undefined && end !== undefined) {
      onPickRange(start.atMs, end.atMs + bucketMs);
    }
  };

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <div className="relative">
        <div
          role="img"
          aria-label={label}
          className={cn(
            'relative flex w-full items-end gap-px',
            isCompact ? 'h-12' : 'h-32 sm:h-40',
            isPicking && 'cursor-crosshair touch-pan-y select-none',
          )}
          onPointerMove={(event) => {
            setOver(barUnder(event, bars.length));
          }}
          onPointerLeave={() => {
            setOver(null);
            setDragFrom(null);
          }}
          onPointerDown={(event) => {
            if (isPicking) {
              setDragFrom(barUnder(event, bars.length));
            }
          }}
          onPointerUp={finish}
        >
          {bars.map((bar, at) => {
            const total = totals[at] ?? 0;
            const isSelected = span !== null && at >= (span[0] ?? 0) && at <= (span[1] ?? 0);

            return (
              <span
                key={bar.atMs}
                data-selected={isSelected ? 'true' : undefined}
                className={cn(
                  'flex h-full min-w-px flex-1 flex-col-reverse rounded-[1px]',
                  isSelected && 'bg-[var(--surface-active)]',
                  over === at && !isSelected && 'bg-[var(--surface-hover)]',
                )}
              >
                {series.map((one) => {
                  const amount = bar.values[one.key] ?? 0;

                  return amount === 0 ? null : (
                    <span
                      key={one.key}
                      data-series={one.key}
                      className="block min-h-px w-full"
                      style={{
                        height: `${((amount / tallest) * 100).toFixed(2)}%`,
                        background: one.colour,
                      }}
                    />
                  );
                })}
                {total === 0 ? (
                  <span aria-hidden className="block h-px w-full bg-[var(--surface-divider)]" />
                ) : null}
              </span>
            );
          })}
        </div>

        {shown === undefined || shown === null || over === null ? null : (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-1 z-10 min-w-40 rounded-md bg-text px-2.5 py-1.5 font-body text-xs text-surface shadow-lg"
            style={{
              left: `${(((over + 0.5) / bars.length) * 100).toFixed(2)}%`,
              transform:
                over > bars.length / 2
                  ? 'translateX(calc(-100% - 0.75rem))'
                  : 'translateX(0.75rem)',
            }}
          >
            <p className="mb-1 font-medium">
              {(formatSpan ?? ((from) => formatTick(from)))(shown.atMs, shown.atMs + bucketMs)}
            </p>
            {series.map((one) => (
              <p key={one.key} className="flex items-center justify-between gap-4 tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: one.colour }}
                  />
                  {one.label}
                </span>
                <span>{(shown.values[one.key] ?? 0).toLocaleString()}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {isCompact ? null : (
        <>
          <div aria-hidden className="relative h-4 text-[0.6875rem] tabular-nums text-text-muted">
            {ticks.map((at, place) => {
              const bar = bars[at];

              return bar === undefined ? null : (
                <span
                  key={at}
                  className={cn(
                    'absolute top-0 whitespace-nowrap',
                    place > 0 && place < ticks.length - 1 && '-translate-x-1/2',
                    place > 0 && place === ticks.length - 1 && '-translate-x-full',
                  )}
                  style={{ left: `${(((at + 0.5) / bars.length) * 100).toFixed(2)}%` }}
                >
                  {formatTick(bar.atMs)}
                </span>
              );
            })}
          </div>

          <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-text-muted">
            {hasLegend
              ? series.map((one) => (
                  <span key={one.key} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ background: one.colour }}
                    />
                    {one.label}
                  </span>
                ))
              : null}
            {isPicking ? <span className="ml-auto">Drag across the bars to zoom in</span> : null}
          </figcaption>
        </>
      )}
    </figure>
  );
};

TimeBars.displayName = 'TimeBars';

export { TimeBars };
