import {
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  MoreVertical as MoreVerticalIcon,
} from '@keyline-icons/react';
import { say } from '@ValenceI18n/say';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { logFilterId } from '@ValenceClient/admin/logViewSelection';
import { describeLogLevel } from '@ValenceScreens/admin/describeLogLevel';
import type { LogLineProps } from './LogLine.types';

const CONTEXT_FIELDS = [
  ['jobId', 'job', 'screens.logLine.jobField'],
  ['jobKind', 'kind', 'screens.logLine.kindField'],
  ['libraryId', 'library', 'screens.logLine.libraryField'],
  ['mediaId', 'media', 'screens.logLine.mediaField'],
  ['sessionId', 'session', 'screens.logLine.sessionField'],
  ['requestId', 'request', 'screens.logLine.requestField'],
] as const;

const SHORT = 8;

/**
 * One record of the log as a dense line — when, how serious, where from, what it said and how often —
 * that opens in place to show its detail and every identifier it carries, each of which narrows the
 * whole log to that one thing when pressed. The menu beside it does the same without opening it.
 *
 * The level is said in words and in colour along the edge, so neither is the only way to tell an error
 * from chatter. A long message is cut to one line until the line is opened, or wrapped throughout
 * where the explorer has been told to wrap.
 *
 * @param record - The record.
 * @param isExpanded - Whether the line is open.
 * @param isWrapped - Whether a long message wraps rather than being cut.
 * @param hasTime - Whether to show when it was written.
 * @param onToggle - Told to open or close the line.
 * @param onFilter - Told the name of a filter to narrow the log to, such as `job:abc`.
 * @param onOpen - Told to open the record in full.
 * @param onCopy - Told to copy the line as text.
 * @param onTrace - Told a job's id, to follow everything that job did.
 * @param describeKind - Says a kind of job in words, so it is not shown as the code it is.
 */
const LogLine = ({
  record,
  isExpanded,
  isWrapped,
  hasTime,
  onToggle,
  onFilter,
  onOpen,
  onCopy,
  onTrace,
  describeKind,
}: LogLineProps) => {
  const look = describeLogLevel(record.level);
  const context = CONTEXT_FIELDS.flatMap(([field, key, name]) => {
    const value = record.context[field];

    return value === null ? [] : [{ key, name: say(name), value }];
  });
  const jobId = record.context.jobId;

  return (
    <li className="border-l-2 border-transparent" style={{ borderLeftColor: look.colour }}>
      <div className="flex items-start">
        <Button
          variant="row"
          size="none"
          aria-expanded={isExpanded}
          label={say('screens.logLine.lineLabel', {
            level: look.label,
            source: record.source,
            message: record.message,
          })}
          hasTooltip={false}
          className="flex min-w-0 flex-1 items-start gap-2.5 px-2 py-1 text-left font-mono text-xs"
          onClick={onToggle}
        >
          <Icon
            of={isExpanded ? ChevronDownIcon : ChevronRightIcon}
            size={14}
            tone="muted"
            className="mt-0.5 shrink-0"
          />

          {hasTime ? (
            <time className="shrink-0 tabular-nums text-text-muted">
              {describeLogTime(record.atMs)}
            </time>
          ) : null}

          <span className="w-14 shrink-0 font-semibold uppercase" style={{ color: look.colour }}>
            {record.level}
          </span>

          <span className="hidden w-20 shrink-0 truncate text-text-muted sm:block">
            {record.source}
          </span>

          <span
            className={cn(
              'min-w-0 flex-1 text-text',
              isWrapped || isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate',
            )}
          >
            {record.message}
          </span>

          {record.count > 1 ? (
            <Badge size="sm" tone="quiet">
              {`×${record.count.toLocaleString()}`}
            </Badge>
          ) : null}
        </Button>

        <ActionMenu
          label={say('screens.logLine.actionsLabel')}
          size="sm"
          align="end"
          trigger={<Icon of={MoreVerticalIcon} size={16} />}
          groups={[
            {
              items: [
                { id: 'open', label: say('screens.logLine.showDetails'), onChoose: onOpen },
                { id: 'copy', label: say('screens.logLine.copyLine'), onChoose: onCopy },
              ],
            },
            {
              name: say('screens.logLine.narrowGroup'),
              items: [
                {
                  id: 'level',
                  label: say('screens.logLine.onlyLevel', { level: record.level }),
                  onChoose: () => {
                    onFilter(logFilterId('level', record.level));
                  },
                },
                {
                  id: 'source',
                  label: say('screens.logLine.onlySource', { source: record.source }),
                  onChoose: () => {
                    onFilter(logFilterId('source', record.source));
                  },
                },
                ...context.map(({ key, name, value }) => ({
                  id: key,
                  label: say('screens.logLine.narrowItem', {
                    field: name,
                    value:
                      key === 'kind'
                        ? describeKind(value)
                        : value.length <= SHORT
                          ? value
                          : `${value.slice(0, SHORT)}…`,
                  }),
                  onChoose: () => {
                    onFilter(logFilterId(key, value));
                  },
                })),
              ],
            },
            ...(jobId === null
              ? []
              : [
                  {
                    items: [
                      {
                        id: 'trace',
                        label: say('screens.logLine.traceJob'),
                        onChoose: () => {
                          onTrace(jobId);
                        },
                      },
                    ],
                  },
                ]),
          ]}
        />
      </div>

      {isExpanded ? (
        <div className="flex flex-col gap-2 pb-2 pl-9 pr-3">
          {record.detail === null ? null : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs leading-relaxed text-text-muted">
              {record.detail}
            </pre>
          )}

          {context.length === 0 ? null : (
            <ul aria-label={say('screens.logLine.contextLabel')} className="flex flex-wrap gap-1.5">
              {context.map(({ key, name, value }) => (
                <li key={key}>
                  <Button
                    variant="secondary"
                    size="xs"
                    label={say('screens.logLine.narrowTo', { field: name, value })}
                    hasTooltip={false}
                    onClick={() => {
                      onFilter(logFilterId(key, value));
                    }}
                  >
                    <span className="text-text-muted">{name}</span>{' '}
                    <span className={key === 'kind' ? '' : 'font-mono'}>
                      {key === 'kind' ? describeKind(value) : value}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
};

LogLine.displayName = 'LogLine';

export { LogLine };
