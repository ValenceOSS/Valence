import { useEffect, useRef } from 'react';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { FeatureVisual } from './components/FeatureVisual/FeatureVisual';
import type { FeatureCardProps } from './FeatureCard.types';

/**
 * One feature in a ruled grid of them, its cell sharing its edges with its neighbours: a working
 * piece of the product doing what the feature says, and its name large beneath with a line about
 * it.
 *
 * Pointed at, a soft light follows the pointer across the cell and the piece of the product leans
 * towards wherever the pointer is, easing back flat once it leaves.
 *
 * @param feature - What it is and why it matters.
 * @param index - Where it sits in the grid, so it arrives in order.
 */
const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const cellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cell = cellRef.current;

    if (cell === null) {
      return;
    }

    const follow = (event: PointerEvent) => {
      const box = cell.getBoundingClientRect();

      cell.style.setProperty('--spot-x', `${(event.clientX - box.left).toString()}px`);
      cell.style.setProperty('--spot-y', `${(event.clientY - box.top).toString()}px`);
      cell.style.setProperty(
        '--tilt-x',
        (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3),
      );
      cell.style.setProperty(
        '--tilt-y',
        (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3),
      );
    };

    const settle = () => {
      cell.style.removeProperty('--tilt-x');
      cell.style.removeProperty('--tilt-y');
    };

    cell.addEventListener('pointermove', follow);
    cell.addEventListener('pointerleave', settle);

    return () => {
      cell.removeEventListener('pointermove', follow);
      cell.removeEventListener('pointerleave', settle);
    };
  }, []);

  return (
    <RevealItem index={index} className="list-none bg-[var(--frame-back)]">
      <article
        ref={cellRef}
        className={cn('group relative isolate flex h-full flex-col gap-7 p-5 sm:p-6')}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(22rem_circle_at_var(--spot-x,50%)_var(--spot-y,50%),var(--surface-hover),transparent_70%)] opacity-0 transition-opacity duration-300 motion-reduce:transition-none acted:opacity-100"
        />

        <div className="relative isolate -mx-2 h-60 min-h-0 overflow-hidden rounded-2xl bg-surface ring-1 ring-border/50 sm:-mx-3">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_100%,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent)]"
          />
          <FeatureVisual kind={feature.visual} />
        </div>

        <div className="flex flex-col gap-3 px-2 pb-3 sm:px-3">
          <h3 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] lg:text-[1.75rem] text-text">
            {feature.title}
          </h3>

          <p className="text-[0.9375rem] leading-relaxed text-text-muted">{feature.detail}</p>
        </div>
      </article>
    </RevealItem>
  );
};

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
