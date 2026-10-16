import { cn } from '@ValenceUI/cn';
import type { LoadFigureProps } from './LoadFigure.types';

const ALIGNMENTS = {
  start: '',
  center: 'lg:items-center lg:text-center',
  end: 'lg:items-end lg:text-right',
} as const;

/**
 * One of the figures over the load chart: what it is, quietly, and the figure beneath it.
 *
 * @param label - What the figure is.
 * @param children - The figure.
 * @param align - Which edge of its column it keeps to once the figures share one row.
 */
const LoadFigure = ({ label, children, align = 'start' }: LoadFigureProps) => (
  <div className={cn('flex min-w-0 flex-col gap-1', ALIGNMENTS[align])}>
    <dt className="truncate text-xs font-medium text-text-muted">{label}</dt>
    <dd className="truncate text-lg font-semibold tabular-nums leading-none tracking-tight text-text">
      {children}
    </dd>
  </div>
);

LoadFigure.displayName = 'LoadFigure';

export { LoadFigure };
