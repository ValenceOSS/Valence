import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';
import type { ChangelogDateProps } from './ChangelogDate.types';

/**
 * When a release shipped and which version it was, set small and quiet above or beside its title.
 *
 * @param date - The day it shipped.
 * @param version - Its version, such as v1.1.0.
 */
const ChangelogDate = ({ date, version }: ChangelogDateProps) => (
  <span className="flex items-center gap-3 text-sm text-text-muted">
    <time dateTime={date} className="whitespace-nowrap">
      {describeReleaseDate(date)}
    </time>
    <span className="rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-xs text-text-muted">
      {version}
    </span>
  </span>
);

ChangelogDate.displayName = 'ChangelogDate';

export { ChangelogDate };
