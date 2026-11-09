import { cn } from '@ValenceUI/cn';
import { PanelCard } from '@ValenceUI/PanelCard';
import type { StatsCardProps } from './StatsCard.types';

/**
 * A titled group of facts in the statistics panel, drawn as a card like any other: the name on the
 * shell, the facts on the panel set into it, laid out as a two-column list of name and value.
 *
 * @param name - What this group of facts is about.
 * @param children - The facts.
 * @param className - Extra classes for the caller's own layout.
 */
const StatsCard = ({ name, children, className }: StatsCardProps) => (
  <PanelCard title={name} isCompact isFlush className={cn('min-w-0', className)}>
    <dl className="grid flex-1 grid-cols-[auto_minmax(0,1fr)] content-start gap-x-3 gap-y-1.5 p-2.5">
      {children}
    </dl>
  </PanelCard>
);

StatsCard.displayName = 'StatsCard';

export { StatsCard };
