import { useLayoutEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { Calendar as CalendarIcon } from '@keyline-icons/react';
import { nameTheShortMonth } from '@ValenceClient/calendar/nameTheShortMonth';
import { nameTheWeekday } from '@ValenceClient/calendar/nameTheWeekday';
import { say } from '@ValenceI18n/say';
import { NothingHere } from '@ValenceUI/NothingHere';
import { cn } from '@ValenceUI/cn';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { timelineDaysOf } from '@ValenceScreens/calendar/timelineDaysOf';
import { timelineRowsOf } from '@ValenceScreens/calendar/timelineRowsOf';
import { CalendarTimelineBar } from '@ValenceScreens/components/CalendarPage/components/CalendarTimelineBar/CalendarTimelineBar';
import type { CalendarTimelineProps } from './CalendarTimeline.types';

const ROW_STEP = 0.04;

const HEADER_ROWS = 2;

/**
 * The release calendar as a timeline: five weeks of days across the top, the months they fall in
 * above them, and a bar for each show or film running from its first release in those weeks to its
 * last, today's column shaded with a dashed line down it. Where the weeks are wider than the page
 * it scrolls sideways, opening with today in the middle. It sits in a solid card, as the admin
 * area's do, in the page's own greys.
 *
 * @param day - The day the calendar is turned to.
 * @param today - Today, which is marked.
 * @param entries - What is released in the weeks shown.
 * @param onOpen - Opens an entry.
 */
const CalendarTimeline = ({ day, today, entries, onOpen }: CalendarTimelineProps) => {
  const isStill = useReducedMotionConfig() === true;
  const scroller = useRef<HTMLDivElement>(null);
  const days = timelineDaysOf(day);
  const rows = timelineRowsOf(entries);
  const todayAt = days.indexOf(today);
  const columnOf = (date: string) => Math.max(days.indexOf(date), 0) + 1;

  useLayoutEffect(() => {
    const element = scroller.current;

    if (element === null || todayAt < 0) {
      return;
    }

    const column = element.scrollWidth / days.length;
    element.scrollLeft = column * (todayAt + 0.5) - element.clientWidth / 2;
  }, [days.length, todayAt]);

  return (
    <div className="rounded-2xl bg-[var(--frame-panel)] [--card-shell:var(--frame-card)]">
      <PanelCard title={say('common.timeline')} isFlush>
        <div ref={scroller} className="valence-rail overflow-x-auto">
          <div
            className="grid min-w-[80rem] px-3 pb-3"
            style={{
              gridTemplateColumns: `repeat(${days.length.toString()}, minmax(0, 1fr))`,
              gridTemplateRows: `auto auto ${rows.length === 0 ? '16rem' : `repeat(${rows.length.toString()}, 3.25rem)`}`,
            }}
          >
            {todayAt < 0 ? null : (
              <>
                <span
                  aria-hidden
                  className="bg-[var(--surface-hover)]"
                  style={{ gridColumn: todayAt + 1, gridRow: `${HEADER_ROWS.toString()} / -1` }}
                />
                <span
                  aria-hidden
                  className="w-0 justify-self-center border-l border-dashed border-text/30"
                  style={{
                    gridColumn: todayAt + 1,
                    gridRow: `${(HEADER_ROWS + 1).toString()} / -1`,
                  }}
                />
              </>
            )}

            {days.map((date, at) =>
              at === 0 || date.endsWith('-01') ? (
                <span
                  key={`month:${date}`}
                  className="whitespace-nowrap pt-3 pb-1 pl-1.5 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-text/50"
                  style={{ gridColumn: at + 1, gridRow: 1 }}
                >
                  {nameTheShortMonth(date)}
                </span>
              ) : null,
            )}

            {days.map((date, at) => {
              const isToday = date === today;

              return (
                <span
                  key={`day:${date}`}
                  className="flex items-center justify-center py-2"
                  style={{ gridColumn: at + 1, gridRow: HEADER_ROWS }}
                >
                  <span
                    className={cn(
                      'flex flex-col items-center rounded-lg px-1.5 py-1 leading-tight',
                      isToday ? 'bg-text text-surface' : 'text-text',
                      date < today && !isToday ? 'opacity-60' : '',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.625rem] font-medium uppercase tracking-[0.08em]',
                        isToday ? '' : 'text-text/50',
                      )}
                    >
                      {nameTheWeekday(date)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {Number(date.slice(8, 10)).toString()}
                    </span>
                  </span>
                </span>
              );
            })}

            {rows.length === 0 ? (
              <div
                className="col-span-full flex items-center justify-center"
                style={{ gridRow: HEADER_ROWS + 1 }}
              >
                <NothingHere
                  of={CalendarIcon}
                  title={say('common.nothingComesOutOnTheseDays')}
                  detail={say('common.episodesAndRequestsAppearHere')}
                />
              </div>
            ) : (
              rows.map((row, at) => {
                const start = columnOf(row.first);
                const end = columnOf(row.last);

                return (
                  <CalendarTimelineBar
                    key={row.key}
                    row={row}
                    today={today}
                    isLeaning={start > days.length * 0.7}
                    isStill={isStill}
                    delay={at * ROW_STEP}
                    gridColumn={`${start.toString()} / ${(end + 1).toString()}`}
                    gridRow={HEADER_ROWS + at + 1}
                    onOpen={onOpen}
                  />
                );
              })
            )}
          </div>
        </div>
      </PanelCard>
    </div>
  );
};

CalendarTimeline.displayName = 'CalendarTimeline';

export { CalendarTimeline };
