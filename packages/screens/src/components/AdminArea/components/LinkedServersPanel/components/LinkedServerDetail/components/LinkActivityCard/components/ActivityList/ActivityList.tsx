import { Badge } from '@ValenceUI/Badge';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { FEDERATION_ACTION_NAMES } from '@ValenceClient/linking/FEDERATION_ACTION_NAMES';
import { FEDERATION_OUTCOME_NAMES } from '@ValenceClient/linking/FEDERATION_OUTCOME_NAMES';
import type { ActivityListProps } from './ActivityList.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * A record of what one server asked another for, newest first: who asked — a person, somebody
 * whose name was not sent, or the server itself — what they asked for and about which title, how
 * it was answered, how many times, and when. Anything refused stands out.
 *
 * @param entries - The record.
 * @param itself - What to call a request the server made for itself.
 * @param someone - What to call a person whose name was not sent.
 */
const ActivityList = ({ entries, itself, someone }: ActivityListProps) =>
  entries.length === 0 ? (
    <p className="px-4 py-4 text-sm text-text-muted">{say('common.nothingYet')}</p>
  ) : (
    <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {entry.personId === null ? itself : (entry.personName ?? someone)}
            </span>
            <span className="truncate text-xs text-text-muted">
              {[FEDERATION_ACTION_NAMES[entry.action], entry.mediaTitle]
                .filter((part) => part !== null)
                .join(' · ')}
            </span>
          </div>

          <Badge size="sm" tone={entry.outcome === 'allowed' ? 'quiet' : 'danger'}>
            {FEDERATION_OUTCOME_NAMES[entry.outcome]}
          </Badge>

          <span className="text-xs text-text-muted">
            {entry.count > 1 ? `${sayCount('common.count.times', entry.count)} · ` : ''}
            {saidWhen(entry.at)}
          </span>
        </li>
      ))}
    </ul>
  );

ActivityList.displayName = 'ActivityList';

export { ActivityList };
