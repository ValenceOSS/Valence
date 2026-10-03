import type { InfoRowProps } from './InfoRow.types';

/**
 * One fact in an information card: what it is, quietly at the start, and its value at the far end,
 * at a menu option's height so the card reads like the menus beside it.
 *
 * @param label - What the fact is.
 * @param children - The value.
 */
const InfoRow = ({ label, children }: InfoRowProps) => (
  <span className="flex min-h-7 items-center justify-between gap-6 rounded-md px-2.5 py-1 font-medium">
    <span className="shrink-0 text-text-muted">{label}</span>
    <span className="min-w-0 text-right tabular-nums text-text">{children}</span>
  </span>
);

InfoRow.displayName = 'InfoRow';

export { InfoRow };
