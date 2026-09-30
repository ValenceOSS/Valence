import { cn } from '@ValenceUI/cn';
import type { StatsCardProps } from './StatsCard.types';

/**
 * A titled group of facts in the statistics panel, drawn as a card: the name on the shell, the facts
 * on the panel set into it, laid out as a two-column list of name and value.
 *
 * @param name - What this group of facts is about.
 * @param children - The facts.
 * @param className - Extra classes for the caller's own layout.
 */
const StatsCard = ({ name, children, className }: StatsCardProps) => (
  <section aria-label={name} className={cn('valence-card-shell flex min-w-0 flex-col', className)}>
    <h4 className="px-2.5 pb-1.5 pt-1.5 text-[0.625rem] uppercase tracking-[0.16em] text-text-muted">
      {name}
    </h4>

    <dl className="valence-card-face grid flex-1 grid-cols-[auto_minmax(0,1fr)] content-start gap-x-3 gap-y-1.5 p-2.5">
      {children}
    </dl>
  </section>
);

StatsCard.displayName = 'StatsCard';

export { StatsCard };
