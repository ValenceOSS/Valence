import { describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { cn } from '@ValenceUI/cn';
import type { LogConsoleProps } from './LogConsole.types';

/**
 * The log as a console prints it, for reading the way the containers write it: numbered lines of
 * time, level, where it came from and what was said, warnings and errors tinted the length of the
 * line — the whole width of the longest line, so the tint carries on as the console scrolls sideways
 * — wrapping onto the next line only where asked to.
 *
 * @param records - The lines, in the order shown.
 * @param isWrapped - Whether long lines wrap rather than running on.
 */
const LogConsole = ({ records, isWrapped }: LogConsoleProps) => (
  <div className="overflow-x-auto py-2">
    <ol
      className={cn(
        'font-mono text-[0.8125rem] leading-relaxed',
        isWrapped ? 'w-full' : 'w-max min-w-full',
      )}
    >
      {records.map((record, at) => (
        <li
          key={record.id}
          className={cn(
            'flex gap-4 px-3',
            record.level === 'error'
              ? 'bg-danger/[0.08]'
              : record.level === 'warn'
                ? 'bg-highlight/[0.08]'
                : '',
          )}
        >
          <span className="w-8 shrink-0 text-right tabular-nums text-text-muted select-none">
            {at + 1}
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 text-text',
              isWrapped ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
            )}
          >
            <span className="tabular-nums">{describeLogTime(record.atMs)}</span>{' '}
            <span
              className={cn(
                'uppercase',
                record.level === 'error'
                  ? 'text-danger'
                  : record.level === 'warn'
                    ? 'text-highlight'
                    : 'text-text-muted',
              )}
            >
              {record.level.padEnd(5)}
            </span>{' '}
            <span className="text-text-muted">{record.source.padEnd(10)}</span> {record.message}
          </span>
        </li>
      ))}
    </ol>
  </div>
);

LogConsole.displayName = 'LogConsole';

export { LogConsole };
