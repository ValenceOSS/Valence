import { motion } from 'motion/react';
import { describeCalendarRun } from '@ValenceClient/calendar/describeCalendarRun';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { posterOfCalendarEntry } from '@ValenceClient/calendar/posterOfCalendarEntry';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { bounceSpring } from '@ValenceUI/animations/reveal';
import type { CalendarTimelineBarProps } from './CalendarTimelineBar.types';

/**
 * One show's or film's bar on the calendar's timeline, running across the days its releases fall
 * on, drawn as the calendar's other rows are: its poster, its name, which episodes or which release,
 * and a badge for where the next of them has got to. Where those words need more room than the days
 * give, the bar grows past them, towards the end of the weeks or, near it, back from it. Pressing
 * it opens the next release, or the last where they are all past.
 *
 * @param row - The show or film, and its releases.
 * @param today - Today, to find the next release by.
 * @param isLeaning - Whether it sits near the end of the weeks, so grows back from its last day.
 * @param isStill - Whether it should simply be there rather than sliding in.
 * @param delay - How long it waits before sliding in, in seconds.
 * @param gridColumn - The columns of its days.
 * @param gridRow - Its row.
 * @param onOpen - Opens a release.
 */
const CalendarTimelineBar = ({
  row,
  today,
  isLeaning,
  isStill,
  delay,
  gridColumn,
  gridRow,
  onOpen,
}: CalendarTimelineBarProps) => {
  const next =
    row.entries.find((entry) => entry.date >= today) ?? row.entries[row.entries.length - 1];

  if (next === undefined) {
    return null;
  }

  const poster = posterOfCalendarEntry(next);
  const badge = describeCalendarState(next.state);

  return (
    <motion.div
      className={cn(
        'relative z-[1] flex h-9 w-max min-w-full self-center',
        isLeaning ? 'justify-self-end' : 'justify-self-start',
      )}
      style={{ gridColumn, gridRow }}
      {...(isStill
        ? {}
        : {
            initial: { opacity: 0, x: isLeaning ? 12 : -12 },
            animate: { opacity: 1, x: 0 },
            transition: { ...bounceSpring, delay },
          })}
    >
      <Button
        variant="bare"
        size="none"
        className="w-full text-left"
        onClick={() => {
          onOpen(next);
        }}
      >
        <span
          className={cn(
            'valence-hoverable flex size-full items-center gap-2 rounded-lg bg-subtle py-1 pr-1.5 pl-1',
            row.last < today ? 'opacity-70' : '',
          )}
        >
          <span className="aspect-[2/3] h-full shrink-0 overflow-hidden rounded-md bg-subtle ring-1 ring-line">
            {poster === null ? null : (
              <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </span>

          <span className="max-w-[16rem] truncate text-sm font-medium text-text">{row.title}</span>

          <span className="flex-1 truncate text-xs whitespace-nowrap text-text-muted">
            {describeCalendarRun(row.entries)}
          </span>

          <Badge size="sm" tone={badge.tone}>
            {badge.label}
          </Badge>
        </span>
      </Button>
    </motion.div>
  );
};

CalendarTimelineBar.displayName = 'CalendarTimelineBar';

export { CalendarTimelineBar };
