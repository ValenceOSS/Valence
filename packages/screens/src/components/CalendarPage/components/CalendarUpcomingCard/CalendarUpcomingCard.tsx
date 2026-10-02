import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { posterOfCalendarEntry } from '@ValenceClient/calendar/posterOfCalendarEntry';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { say } from '@ValenceI18n/say';
import type { CalendarUpcomingCardProps } from './CalendarUpcomingCard.types';

/**
 * One thing coming out, drawn as a request is on the requests page: its poster, its title with
 * where it has got to, which episode or release it is and who asked for it, and a button that opens
 * it — its page where the library has it, and its details where it does not.
 *
 * @param entry - What comes out.
 * @param myId - Who is looking, so their own requests say so.
 * @param onOpen - Opens it.
 */
const CalendarUpcomingCard = ({ entry, myId, onOpen }: CalendarUpcomingCardProps) => {
  const poster = posterOfCalendarEntry(entry);
  const badge = describeCalendarState(entry.state);

  return (
    <Card className="flex items-start gap-4">
      <span className="aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md bg-surface-raised ring-1 ring-line">
        {poster === null ? null : (
          <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-text">{entry.title}</span>
          <Badge size="sm" tone={badge.tone}>
            {badge.label}
          </Badge>
        </span>

        <span className="text-sm text-text">{describeCalendarEntry(entry)}</span>

        {entry.requestedBy === null ? null : (
          <span className="text-xs text-text-muted">
            {entry.requestedBy.id === myId
              ? say('common.askedByYou')
              : say('common.askedByName', { name: entry.requestedBy.name })}
          </span>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          onOpen(entry);
        }}
      >
        {entry.state === 'available' ? say('common.open') : say('common.details')}
      </Button>
    </Card>
  );
};

CalendarUpcomingCard.displayName = 'CalendarUpcomingCard';

export { CalendarUpcomingCard };
