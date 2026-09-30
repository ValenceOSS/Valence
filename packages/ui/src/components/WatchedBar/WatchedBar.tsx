import { cn } from '@ValenceUI/cn';
import type { WatchedBarProps } from './WatchedBar.types';

/**
 * How far into something somebody got, as a short bar drawn beneath its picture rather than over it,
 * so the artwork stays whole and every card and row says it the same way.
 *
 * @param watched - How much has been watched, from nothing to all of it.
 * @param className - Extra classes for the caller's own layout.
 */
const WatchedBar = ({ watched, className }: WatchedBarProps) => {
  const share = Math.min(Math.max(watched, 0), 1);

  return (
    <span
      role="img"
      aria-label={`${Math.round(share * 100).toString()}% watched`}
      className={cn(
        'mx-auto block h-1 w-3/5 overflow-hidden rounded-full bg-on-scrim/25',
        className,
      )}
    >
      <span
        className="block h-full rounded-full bg-primary"
        style={{ width: `${(share * 100).toString()}%` }}
      />
    </span>
  );
};

WatchedBar.displayName = 'WatchedBar';

export { WatchedBar };
