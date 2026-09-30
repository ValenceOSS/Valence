import type { StatsSummaryProps } from './StatsSummary.types';
import { say } from '@ValenceI18n/say';

/**
 * The handful of figures that answer most questions about a stream at a glance, as a strip of small
 * tiles above the detail: a figure with nothing to report yet is a quiet dash.
 *
 * @param items - Each figure and what it is.
 */
const StatsSummary = ({ items }: StatsSummaryProps) => (
  <dl
    aria-label={say('screens.streamStats.statsSummary.atAGlance')}
    className="grid grid-cols-3 gap-1.5"
  >
    {items.map((item) => (
      <div key={item.label} className="valence-card-face flex min-w-0 flex-col gap-0.5 px-2.5 py-2">
        <dt className="truncate text-[0.625rem] uppercase tracking-[0.14em] text-text-muted">
          {item.label}
        </dt>
        <dd
          className={
            item.value === null
              ? 'text-sm text-text-muted'
              : 'truncate text-sm font-semibold tabular-nums tracking-tight text-text'
          }
        >
          {item.value ?? '—'}
        </dd>
      </div>
    ))}
  </dl>
);

StatsSummary.displayName = 'StatsSummary';

export { StatsSummary };
