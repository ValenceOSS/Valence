import { cn } from '@ValenceUI/cn';
import type { StatStripProps } from './StatStrip.types';

/**
 * A row of figures read at a glance: what each is, its number in large type and a line qualifying
 * it, with an optional history drawn faintly behind it. The figures are separated by thin lines
 * rather than boxes, so the strip sits on the page as it is and is never a card, or a card inside
 * one.
 *
 * @param items - The figures.
 * @param label - What the strip is about, read out to anybody who cannot see it.
 * @param className - Extra classes for the caller's own layout.
 */
const StatStrip = ({ items, label, className }: StatStripProps) => (
  <dl
    aria-label={label}
    className={cn(
      'grid grid-cols-2 gap-y-4 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] sm:gap-y-0',
      className,
    )}
  >
    {items.map((item) => (
      <div
        key={item.id}
        className="relative flex flex-col gap-1 overflow-hidden border-[var(--surface-line)] px-4 py-1 first:pl-0 sm:border-l sm:first:border-l-0"
      >
        {item.history === undefined ? null : (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30">
            {item.history}
          </span>
        )}

        <dt className="relative text-[0.6875rem] uppercase tracking-[0.16em] text-text-muted">
          {item.label}
        </dt>

        <dd
          className={cn(
            'relative text-xl font-semibold tabular-nums leading-none tracking-tight',
            item.isAlarming === true ? 'text-danger' : 'text-text',
          )}
        >
          {item.value}
        </dd>

        {item.detail === undefined ? null : (
          <dd className="relative truncate text-xs text-text-muted">{item.detail}</dd>
        )}
      </div>
    ))}
  </dl>
);

StatStrip.displayName = 'StatStrip';

export { StatStrip };
