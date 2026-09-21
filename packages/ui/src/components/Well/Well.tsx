import { cn } from '@ValenceUI/cn';
import type { WellProps } from './Well.types';

/**
 * A rounded container set into whatever it sits on, for a chart, a list or a table that should read
 * as one thing apart from the controls around it. It is drawn as a card's own background is — the
 * shell around a card's face — with the line around a card. It has no shell of its own and casts no
 * shadow: it is a place to put content and never a card, and a card can hold any number of them.
 *
 * @param children - What goes in it.
 * @param isFlush - Whether it has no padding, for content that draws to its own edges.
 * @param className - Extra classes for the caller's own layout.
 */
const Well = ({ children, isFlush = false, className }: WellProps) => (
  <div className={cn('valence-well rounded-xl', isFlush ? '' : 'p-3 sm:p-4', className)}>
    {children}
  </div>
);

Well.displayName = 'Well';

export { Well };
