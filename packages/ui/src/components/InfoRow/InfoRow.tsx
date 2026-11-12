import { cn } from '@ValenceUI/cn';
import type { InfoRowProps } from './InfoRow.types';

/**
 * One fact in an information card: what it is, quietly at the start, and its value at the far end,
 * at a menu option's height so the card reads like the menus beside it.
 *
 * @param label - What the fact is.
 * @param keyClassName - The text colour of a short dotted line drawn before the label, where the
 *   fact is read off a line on a chart and the line is drawn in that colour.
 * @param children - The value.
 */
const InfoRow = ({ label, keyClassName, children }: InfoRowProps) => (
  <span className="flex min-h-7 items-center justify-between gap-6 rounded-md px-2.5 py-1 font-medium">
    <span className="flex shrink-0 items-center gap-2 text-text-muted">
      {keyClassName === undefined ? null : (
        <span
          aria-hidden
          className={cn('w-3 border-t-2 border-dotted border-current', keyClassName)}
        />
      )}
      {label}
    </span>
    <span className="min-w-0 text-right tabular-nums text-text">{children}</span>
  </span>
);

InfoRow.displayName = 'InfoRow';

export { InfoRow };
