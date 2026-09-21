import { cn } from '@ValenceUI/cn';
import type { WellProps } from './Well.types';

/**
 * A rounded container set into whatever it sits on, for a chart, a list or a table that should read
 * as one thing apart from the controls around it. It takes the grey of a card's background and the
 * line around a card, so it belongs with the card it sits in, but has no shell of its own and casts no
 * shadow — it is a place to put content and never a card, and a card can hold any number of them.
 *
 * @param children - What goes in it.
 * @param isFlush - Whether it has no padding, for content that draws to its own edges.
 * @param className - Extra classes for the caller's own layout.
 */
const Well = ({ children, isFlush = false, className }: WellProps) => (
  <div
    className={cn(
      'rounded-xl border border-[var(--surface-line)] bg-[var(--card-shell)]',
      isFlush ? '' : 'p-3 sm:p-4',
      className,
    )}
  >
    {children}
  </div>
);

Well.displayName = 'Well';

export { Well };
