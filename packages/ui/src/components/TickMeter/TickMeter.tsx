import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { TickMeterProps, TickMeterTone } from './TickMeter.types';

const INKS: Record<TickMeterTone, string> = {
  primary: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

const WAVE_MILLISECONDS = 180;

const MOST_STEP_MILLISECONDS = 18;

/**
 * How full something is, drawn as a row of upright rounded ticks lit from the left, so a share
 * reads at a glance and a small change still moves a whole tick. Any share above nothing lights at
 * least one tick, so something in use never looks empty.
 *
 * Each tick is a dim track with its light laid over it, and only the light moves: it rises from
 * the tick's foot and fades in as it lights, and sinks and fades as it goes out. When the share
 * moves, the ticks between the old level and the new one change as one short wave in the direction
 * it moved, the wave taking the same time however far it goes, so a reading is never left waiting
 * on the one before it. A change of colour nearing the top eases across without moving anything.
 * Somebody who asks for less motion sees the light fade in place, with no rise and no wave.
 *
 * @param fraction - How full, from nothing to all of it.
 * @param ticks - How many ticks the row is cut into.
 * @param tone - The colour the lit ticks are drawn in.
 * @param className - Extra classes for the caller's own layout.
 */
const TickMeter = ({ fraction, ticks = 24, tone = 'primary', className }: TickMeterProps) => {
  const share = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  const target = share === 0 ? 0 : Math.max(1, Math.round(share * ticks));
  const [{ lit, from }, setShown] = useState({ lit: 0, from: 0 });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShown((shown) => (shown.lit === target ? shown : { lit: target, from: shown.lit }));
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target]);

  const isFilling = lit >= from;
  const step = Math.min(
    MOST_STEP_MILLISECONDS,
    WAVE_MILLISECONDS / Math.max(1, Math.abs(lit - from)),
  );

  return (
    <span aria-hidden className={cn('flex h-8 items-stretch gap-[3px]', className)}>
      {Array.from({ length: ticks }, (_, at) => {
        const isLit = at < lit;
        const place = isFilling ? at - from : from - 1 - at;
        const waits = `${Math.round(Math.max(0, place) * step).toString()}ms`;

        return (
          <span
            key={at}
            className="relative min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]"
          >
            <span
              style={{
                backgroundColor: INKS[tone],
                transitionDelay: `${waits}, ${waits}, 0ms`,
              }}
              className={cn(
                'absolute inset-0 origin-bottom rounded-full',
                'transition-[transform,opacity,background-color] [transition-duration:220ms,220ms,200ms] [transition-timing-function:var(--ease-out),var(--ease-out),ease]',
                'motion-reduce:transition-[opacity,background-color] motion-reduce:![transition-delay:0ms]',
                isLit
                  ? 'scale-y-100 opacity-100'
                  : 'scale-y-[0.4] opacity-0 motion-reduce:scale-y-100',
              )}
            />
          </span>
        );
      })}
    </span>
  );
};

TickMeter.displayName = 'TickMeter';

export { TickMeter };
