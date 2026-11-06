import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { SelectionBarProps } from './SelectionBar.types';
import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';

/**
 * What can be done to the rows ticked in a table, all at once, standing where the table's own
 * controls stand while anything is ticked, at their height so the rows beneath do not move: how many
 * are ticked, a way to tick every row there is once those shown are all ticked, the actions, and a
 * way to untick them all.
 *
 * @param count - How many rows are ticked.
 * @param total - How many rows there are in all, where more than are shown.
 * @param onSelectAll - Ticks every row there is, where they are not all ticked yet.
 * @param isSelectingAll - Whether every row is being ticked now.
 * @param children - The actions, as extra-small secondary buttons and a labelled menu.
 * @param onClear - Unticks them all.
 * @param className - Extra classes for the caller's own layout.
 */
const SelectionBar = ({
  count,
  total,
  onSelectAll,
  isSelectingAll = false,
  children,
  onClear,
  className,
}: SelectionBarProps) => (
  <div
    role="toolbar"
    aria-label={sayCount('common.count.selected', count)}
    className={cn('flex min-h-7 flex-wrap items-center gap-2', className)}
  >
    <span className="text-sm tabular-nums text-text-muted">
      {sayCount('common.count.selected', count)}
    </span>

    {onSelectAll === undefined || total === undefined || total <= count ? null : (
      <Button variant="ghost" size="xs" disabled={isSelectingAll} onClick={onSelectAll}>
        {sayCount('ui.selectionBar.count.selectAll', total)}
      </Button>
    )}

    {children}

    <Button variant="ghost" size="xs" onClick={onClear}>
      {say('common.clear')}
    </Button>
  </div>
);

SelectionBar.displayName = 'SelectionBar';

export { SelectionBar };
