import { Button } from '@ValenceUI/Button';
import type { OverviewStatProps } from './OverviewStat.types';

/**
 * One of the figures across the top of the overview: what it counts, the number large, and a line
 * beneath, set straight on the page rather than in a card, opening the panel behind it when
 * pressed.
 *
 * @param label - What it counts.
 * @param value - The number.
 * @param detail - A line beneath.
 * @param onOpen - Told to open the panel behind it, where there is one.
 */
const OverviewStat = ({ label, value, detail, onOpen }: OverviewStatProps) => {
  const body = (
    <span className="flex flex-col gap-1.5 text-left">
      <span className="text-[0.8125rem] text-text-muted">{label}</span>
      <span className="font-sans text-4xl font-semibold tracking-headline tabular-nums text-text">
        {value}
      </span>
      {detail === undefined ? null : (
        <span className="text-[0.8125rem] text-text-muted">{detail}</span>
      )}
    </span>
  );

  return (
    <div className="min-w-0 flex-1 px-5 py-2 first:pl-0 sm:border-l sm:border-[var(--surface-line)] sm:first:border-l-0">
      {onOpen === undefined ? (
        body
      ) : (
        <Button variant="bare" size="none" label={label} hasTooltip={false} onClick={onOpen}>
          {body}
        </Button>
      )}
    </div>
  );
};

OverviewStat.displayName = 'OverviewStat';

export { OverviewStat };
