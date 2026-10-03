import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronRight as ChevronRightFilledIcon } from '@keyline-icons/react/fill';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { nameTheWeekday } from '@ValenceClient/calendar/nameTheWeekday';
import { cn } from '@ValenceUI/cn';
import { sayCount } from '@ValenceI18n/sayCount';
import { calendarDayArrival } from '@ValenceScreens/calendar/calendarDayArrival';
import { CalendarArrival } from '@ValenceScreens/components/CalendarPage/components/CalendarArrival/CalendarArrival';
import { CalendarEntryRow } from '@ValenceScreens/components/CalendarPage/components/CalendarEntryRow/CalendarEntryRow';
import { CalendarQuietDay } from '@ValenceScreens/components/CalendarPage/components/CalendarQuietDay/CalendarQuietDay';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { CalendarMonthProps } from './CalendarMonth.types';

const SHOWN_A_DAY = 3;

const DAY_STEP = 0.022;

const ENTRY_LEAD = 0.12;

const ENTRY_STEP = 0.05;

/**
 * The release calendar a month at a time, where there is room for it: six weeks of days washing in from the top-left, each a
 * card of the same size listing the first few things released on it, or saying nothing is, with
 * how many more there are in its heading opening that day's week.
 *
 * @param day - Any day of the month shown.
 * @param today - Today, which is marked.
 * @param entries - What is released in the weeks shown.
 * @param onOpen - Opens an entry.
 * @param onOpenWeek - Shows the week a day falls in.
 */
const CalendarMonth = ({ day, today, entries, onOpen, onOpenWeek }: CalendarMonthProps) => {
  const isStill = useReducedMotionConfig() === true;
  const grid = monthGridOf(day);
  const month = day.slice(0, 7);

  return (
    <div className="hidden flex-col gap-2 xl:flex">
      <div className="grid grid-cols-7 gap-2" aria-hidden>
        {grid.slice(0, 7).map((date) => (
          <span
            key={date}
            className="px-2 text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted"
          >
            {nameTheWeekday(date)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {grid.map((date, at) => {
          const onIt = entries.filter((entry) => entry.date === date);
          const isToday = date === today;
          const isThisMonth = date.slice(0, 7) === month;
          const wait = (Math.floor(at / 7) + (at % 7)) * DAY_STEP;

          return (
            <motion.div
              key={date}
              {...calendarDayArrival(wait, isStill)}
              className="flex h-44 min-w-0 rounded-2xl bg-surface transition-shadow duration-[var(--duration-fast)] hover:ring-1 hover:ring-text/60"
            >
              <PanelCard
                title={Number(date.slice(8, 10)).toString()}
                isFlush
                isCompact
                isHighlighted={isToday}
                actions={
                  onIt.length > SHOWN_A_DAY ? (
                    <PanelCardAction
                      icon={ChevronRightFilledIcon}
                      onClick={() => {
                        onOpenWeek(date);
                      }}
                    >
                      {sayCount(
                        'screens.calendarPage.calendarMonth.countMore',
                        onIt.length - SHOWN_A_DAY,
                      )}
                    </PanelCardAction>
                  ) : undefined
                }
                className="h-full w-full min-w-0"
              >
                <div
                  className={cn(
                    'flex min-h-0 flex-1 flex-col',
                    isThisMonth ? '' : 'opacity-40',
                    isThisMonth && date < today ? 'opacity-70' : '',
                  )}
                >
                  <AnimatePresence initial={!isStill} mode="wait">
                    {onIt.length === 0 ? (
                      <CalendarQuietDay key="quiet" />
                    ) : (
                      <ul key="entries" className="flex flex-col gap-0.5 p-1">
                        <AnimatePresence initial={!isStill}>
                          {onIt.slice(0, SHOWN_A_DAY).map((entry, index) => (
                            <CalendarArrival
                              key={entry.id}
                              delay={wait + ENTRY_LEAD + index * ENTRY_STEP}
                            >
                              <CalendarEntryRow entry={entry} onOpen={onOpen} isCompact />
                            </CalendarArrival>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </AnimatePresence>
                </div>
              </PanelCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

CalendarMonth.displayName = 'CalendarMonth';

export { CalendarMonth };
