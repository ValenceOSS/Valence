import { cn } from '@ValenceUI/cn';
import { Tooltip } from '@ValenceUI/Tooltip';
import type { CountMarkProps } from './CountMark.types';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * How many more there are than a row of overlapping faces or marks draws, as a circle of the same
 * size at its end, named on hover.
 *
 * @param count - How many are left out.
 * @param label - What the circle stands for, read out and shown on hover.
 * @param className - Its size and ring, to match the faces or marks it ends.
 */
const CountMark = ({ count, label, className }: CountMarkProps) => (
  <Tooltip label={label}>
    <span
      role="img"
      aria-label={label}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[0.625rem] font-semibold tabular-nums text-text shadow-sm',
        className,
      )}
    >
      {sayCount('ui.countMark.plusCount', count)}
    </span>
  </Tooltip>
);

CountMark.displayName = 'CountMark';

export { CountMark };
