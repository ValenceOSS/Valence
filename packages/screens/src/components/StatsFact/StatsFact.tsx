import { cn } from '@ValenceUI/cn';
import type { StatsFactProps } from './StatsFact.types';

/**
 * One named fact in a statistics card. A fact with nothing to report is drawn as a quiet dash rather
 * than a sentence saying so, and an identifier or address is set in monospace on one line, cut short
 * where it has to be, with the whole of it on hover.
 *
 * @param name - What the fact is.
 * @param value - The fact, or null where there is nothing to report.
 * @param isCode - Whether it is an identifier or address rather than prose.
 */
const StatsFact = ({ name, value, isCode = false }: StatsFactProps) => (
  <>
    <dt className="text-[0.6875rem] leading-5 text-text-muted">{name}</dt>
    <dd
      {...(isCode && typeof value === 'string' ? { title: value } : {})}
      className={cn(
        'min-w-0 text-right text-[0.75rem] leading-5 tabular-nums',
        value === null ? 'text-text-muted' : 'font-medium text-text',
        isCode ? 'truncate font-mono text-[0.6875rem] font-normal text-text-muted' : 'break-words',
      )}
    >
      {value ?? '—'}
    </dd>
  </>
);

StatsFact.displayName = 'StatsFact';

export { StatsFact };
