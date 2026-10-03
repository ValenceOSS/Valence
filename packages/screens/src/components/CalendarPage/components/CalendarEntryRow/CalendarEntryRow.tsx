import { posterOfCalendarEntry } from '@ValenceClient/calendar/posterOfCalendarEntry';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { CalendarStateSign } from '@ValenceScreens/components/CalendarPage/components/CalendarStateSign/CalendarStateSign';
import type { CalendarEntryRowProps } from './CalendarEntryRow.types';

/**
 * One thing released on the release calendar, as a row of a day: its poster, its title, which
 * episode or which release it is, and where it has got to, opening the title when pressed.
 *
 * @param entry - What is released.
 * @param onOpen - Opens it.
 * @param isCompact - Whether to draw it small, for a day with little room, which leaves out who
 *   asked for it and says where it has got to with a sign rather than a badge.
 */
const CalendarEntryRow = ({ entry, onOpen, isCompact = false }: CalendarEntryRowProps) => {
  const poster = posterOfCalendarEntry(entry);
  const badge = describeCalendarState(entry.state);

  return (
    <Button
      variant="bare"
      size="none"
      className="w-full text-left"
      onClick={() => {
        onOpen(entry);
      }}
    >
      <span
        className={cn(
          'valence-hoverable flex w-full items-center rounded-lg',
          isCompact ? 'gap-2 p-1' : 'gap-3 p-2',
        )}
      >
        <span
          className={cn(
            'aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-subtle ring-1 ring-line',
            isCompact ? 'w-5' : 'w-11',
          )}
        >
          {poster === null ? null : (
            <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'truncate font-medium text-text',
              isCompact ? 'text-xs leading-tight' : 'text-sm',
            )}
          >
            {entry.title}
          </span>
          <span
            className={cn(
              'truncate text-text-muted',
              isCompact ? 'text-[0.68rem] leading-tight' : 'text-xs',
            )}
          >
            {describeCalendarEntry(entry)}
          </span>
          {entry.requestedBy === null || isCompact ? null : (
            <span className="truncate text-xs text-text-muted">{entry.requestedBy.name}</span>
          )}
        </span>

        {isCompact ? (
          <CalendarStateSign state={entry.state} />
        ) : (
          <Badge size="sm" tone={badge.tone}>
            {badge.label}
          </Badge>
        )}
      </span>
    </Button>
  );
};

CalendarEntryRow.displayName = 'CalendarEntryRow';

export { CalendarEntryRow };
