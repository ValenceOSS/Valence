import { useEffect, useState } from 'react';
import { useMotion } from '@ValenceClient/shell/useMotion';
import { cn } from '@ValenceUI/cn';
import type { PlayingBarsProps } from './PlayingBars.types';

const BARS = [{ beatMs: 520 }, { beatMs: 380 }, { beatMs: 610 }, { beatMs: 450 }] as const;

const RESTS_AT = 0.3;

const STANDS_AT = 0.65;

const LAGS_BY_MS = 96;

/**
 * The bars that say a song is playing: four thin bars, from the bass at the left to the treble at
 * the right, each rising and falling out of step with the others while it plays, and settling low
 * and still while it pauses. Somebody who has asked for less movement sees them stand still,
 * halfway up, instead.
 *
 * The bars keep the same beat whatever the song is playing through — this window or another
 * device's ears at a listening party — because they are a signpost that something is going, not a
 * meter of what it sounds like here.
 *
 * @param isPlaying - Whether the song is playing rather than paused.
 * @param colour - What colour the bars are.
 * @param size - How tall and wide the bars stand together.
 * @param className - Anything else the caller's layout needs.
 */
const PlayingBars = ({
  isPlaying,
  colour = 'var(--color-text-muted)',
  size = 16,
  className,
}: PlayingBarsProps) => {
  const { motion } = useMotion();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isStill = motion === 'reduced' || (motion === 'system' && prefersReducedMotion);
  const isBeating = isPlaying && !isStill;
  const width = Math.max(Math.round(size / 7), 2);

  return (
    <span
      aria-hidden
      className={cn('flex items-end justify-between', className)}
      style={{ width: size, height: size }}
    >
      {BARS.map((bar, at) => (
        <span
          key={at}
          className={cn(
            isBeating ? 'valence-bars' : undefined,
            !isStill
              ? 'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]'
              : undefined,
          )}
          style={{
            width,
            height: size,
            borderRadius: width / 2,
            backgroundColor: colour,
            transformOrigin: 'bottom',
            transform: `scaleY(${isPlaying && isStill ? STANDS_AT : RESTS_AT})`,
            animationDuration: `${bar.beatMs}ms`,
            animationDelay: `${(-1 * at * LAGS_BY_MS).toString()}ms`,
          }}
        />
      ))}
    </span>
  );
};

PlayingBars.displayName = 'PlayingBars';

export { PlayingBars };
