import type { LoadFigureProps } from './LoadFigure.types';

/**
 * One of the figures over the load chart: what it is, quietly, and the figure beneath it.
 *
 * @param label - What the figure is.
 * @param children - The figure.
 */
const LoadFigure = ({ label, children }: LoadFigureProps) => (
  <div className="flex min-w-0 flex-col gap-1">
    <dt className="truncate text-xs font-medium text-text-muted">{label}</dt>
    <dd className="truncate text-lg font-semibold tabular-nums leading-none tracking-tight text-text">
      {children}
    </dd>
  </div>
);

LoadFigure.displayName = 'LoadFigure';

export { LoadFigure };
