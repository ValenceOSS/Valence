import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { BarListProps } from './BarList.types';

/**
 * A ranked list where each row has a slim bar under it, as long as its share of the biggest, and the
 * figure at its end — "which sources say the most", read at a glance and in order.
 *
 * Where the caller listens for a choice, each row narrows to itself when pressed and says which are
 * chosen already, so the list is a way of filtering as well as of reading.
 *
 * @param items - The rows, biggest first.
 * @param label - What the list is, read out to anybody who cannot see it.
 * @param heading - The title of the first column.
 * @param valueHeading - The title of the figures.
 * @param emptyMessage - What to say when there are no rows.
 * @param chosen - The ids of the rows already narrowed to.
 * @param onChoose - Told which row was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const BarList = ({
  items,
  label,
  heading,
  valueHeading,
  emptyMessage,
  chosen,
  onChoose,
  className,
}: BarListProps) => {
  const biggest = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between px-2 text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
        <span>{heading}</span>
        <span>{valueHeading}</span>
      </div>

      {items.length === 0 ? (
        <p className="px-2 py-3 font-body text-xs text-text-muted">{emptyMessage}</p>
      ) : (
        <ul aria-label={label} className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isChosen = chosen?.has(item.id) === true;
            const row = (
              <span className="flex w-full flex-col gap-1.5 text-left">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className={cn('truncate', isChosen && 'font-semibold')}>
                      {item.label}
                    </span>
                    {item.detail === undefined ? null : (
                      <span className="truncate text-[0.6875rem] text-text-muted">
                        {item.detail}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-text-muted">
                    {item.value.toLocaleString()}
                  </span>
                </span>

                <span
                  aria-hidden
                  className="block h-1 overflow-hidden rounded-full bg-[var(--surface-hover)]"
                >
                  <span
                    data-fill
                    className={cn(
                      'block h-full rounded-full bg-text',
                      isChosen ? 'opacity-90' : 'opacity-40',
                    )}
                    style={{ width: `${((item.value / biggest) * 100).toFixed(1)}%` }}
                  />
                </span>
              </span>
            );

            return (
              <li key={item.id}>
                {onChoose === undefined ? (
                  <span className="flex px-2 py-1.5 font-body text-sm">{row}</span>
                ) : (
                  <Button
                    variant="row"
                    size="none"
                    aria-pressed={isChosen}
                    className="flex w-full px-2 py-1.5 font-body text-sm"
                    onClick={() => {
                      onChoose(item.id);
                    }}
                  >
                    {row}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

BarList.displayName = 'BarList';

export { BarList };
