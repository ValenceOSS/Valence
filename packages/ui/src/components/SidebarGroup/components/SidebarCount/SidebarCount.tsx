import { cn } from '@ValenceUI/cn';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import type { SidebarCountProps } from './SidebarCount.types';

const MOST_SHOWN = 99;

/**
 * How many things wait on somebody behind a sidebar item: a small figure at the row's end, or a dot
 * in the corner of the icon on a rail too narrow for a figure. Read out with the item's own label
 * rather than on its own.
 *
 * @param count - How many there are.
 * @param isUrgent - Whether they are failures rather than things to look at, drawn in the danger
 *   colour.
 * @param isDot - Whether to draw only a dot, on a folded rail.
 */
const SidebarCount = ({ count, isUrgent = false, isDot = false }: SidebarCountProps) =>
  isDot ? (
    <span
      aria-hidden
      className={cn(
        'absolute top-1.5 right-1.5 z-10 size-2 rounded-full ring-2 ring-[var(--frame-back)]',
        isUrgent ? 'bg-danger' : 'bg-text-muted',
      )}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'relative z-10 ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5',
        'bg-[var(--surface-active)] text-[0.6875rem] font-semibold tabular-nums',
        isUrgent ? 'text-danger' : 'text-text',
      )}
    >
      {count > MOST_SHOWN ? (
        <FormattedNumber value={MOST_SHOWN} suffix="+" />
      ) : (
        <FormattedNumber value={count} />
      )}
    </span>
  );

SidebarCount.displayName = 'SidebarCount';

export { SidebarCount };
