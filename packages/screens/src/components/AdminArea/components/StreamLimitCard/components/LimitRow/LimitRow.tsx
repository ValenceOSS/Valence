import type { LimitRowProps } from './LimitRow.types';

/**
 * One limit as a row of the card: what it is and what it does, beside the control that sets it.
 *
 * @param label - What the limit is.
 * @param detail - What it does.
 * @param control - What sets it.
 */
const LimitRow = ({ label, detail, control }: LimitRowProps) => (
  <li className="flex items-center justify-between gap-4 px-4 py-3">
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <span className="text-xs text-text-muted">{detail}</span>
    </div>

    {control}
  </li>
);

LimitRow.displayName = 'LimitRow';

export { LimitRow };
