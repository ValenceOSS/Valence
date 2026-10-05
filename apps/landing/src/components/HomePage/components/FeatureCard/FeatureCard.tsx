import { useEffect, useRef } from 'react';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { FeatureVisual } from './components/FeatureVisual/FeatureVisual';
import type { FeatureCardProps, FeatureCardShape } from './FeatureCard.types';

const FIGURE = 'font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-text-muted/70';

const SPANS: Record<FeatureCardShape, string> = {
  square: '',
  wide: 'sm:col-span-2',
};

const LAYOUTS: Record<FeatureCardShape, string> = {
  square: 'flex-col',
  wide: 'flex-col lg:flex-row-reverse lg:gap-10',
};

const PICTURES: Record<FeatureCardShape, string> = {
  square: 'h-80',
  wide: 'h-60 lg:h-auto lg:min-h-72 lg:w-[58%] lg:shrink-0',
};

/**
 * One feature in a ruled grid of them, the way a figure sits in a paper: its number, a working
 * piece of the product doing what the feature says, and the words for it beneath or beside.
 *
 * It is a rounded card of its own, set apart from its neighbours, and its picture stands on an
 * isometric plane inside it, so the product reads as an object on the page rather than a flat
 * screenshot. Pointed at, a soft light follows the pointer across it and its
 * picture acts the feature out. In a group of four, two are drawn wide, the words beside
 * the picture rather than beneath it.
 *
 * @param feature - What it is and why it matters.
 * @param index - Where it sits in the grid, so it arrives in order.
 * @param figure - Its number, as a figure in the page is numbered.
 * @param shape - How much of the grid it takes: one cell, or two side by side.
 */
const FeatureCard = ({ feature, index, figure, shape = 'square' }: FeatureCardProps) => {
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
    };

    cell.addEventListener('pointermove', follow);

    return () => {
      cell.removeEventListener('pointermove', follow);
    };
  }, []);

  return (
    <RevealItem
      index={index}
      className={cn(
        'valence-surface valence-surface--flat valence-feature-card list-none overflow-hidden rounded-3xl',
        SPANS[shape],
      )}
    >
      <article
        ref={cellRef}
        className={cn('group relative isolate flex h-full gap-6 p-6 sm:p-8', LAYOUTS[shape])}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(22rem_circle_at_var(--spot-x,50%)_var(--spot-y,50%),var(--surface-hover),transparent_70%)] opacity-0 transition-opacity duration-300 motion-reduce:transition-none acted:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 shadow-[inset_0_0_0_1px_var(--surface-line)] transition-opacity duration-300 motion-reduce:transition-none acted:opacity-100"
        />

        <div className={cn('flex flex-col gap-4', PICTURES[shape])}>
          <span className={cn(FIGURE, shape === 'wide' ? 'lg:hidden' : '')}>Fig {figure}</span>

          <div className="min-h-0 flex-1">
            <FeatureVisual kind={feature.visual} />
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col gap-2',
            shape === 'wide' ? 'lg:flex-1 lg:justify-between lg:py-1' : '',
          )}
        >
          {shape === 'wide' ? (
            <span className={cn(FIGURE, 'hidden lg:block')}>Fig {figure}</span>
          ) : null}

          <span className="flex flex-col gap-2">
            <h3
              className={cn(
                'text-balance font-semibold tracking-tight text-text',
                shape === 'square' ? 'text-lg' : 'text-xl lg:text-2xl',
              )}
            >
              {feature.title}
            </h3>

            <p className="text-sm leading-relaxed text-text-muted">{feature.detail}</p>
          </span>
        </div>
      </article>
    </RevealItem>
  );
};

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
