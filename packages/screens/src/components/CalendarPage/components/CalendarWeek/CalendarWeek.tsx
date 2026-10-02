import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { addDays } from '@ValenceCore/functions/addDays';
import { startOfWeek } from '@ValenceCore/functions/startOfWeek';
import { nameTheShortDay } from '@ValenceClient/calendar/nameTheShortDay';
import { say } from '@ValenceI18n/say';
import { cn } from '@ValenceUI/cn';
import { calendarDayArrival } from '@ValenceScreens/calendar/calendarDayArrival';
import { CalendarArrival } from '@ValenceScreens/components/CalendarPage/components/CalendarArrival/CalendarArrival';
import { CalendarEntryRow } from '@ValenceScreens/components/CalendarPage/components/CalendarEntryRow/CalendarEntryRow';
import { CalendarQuietDay } from '@ValenceScreens/components/CalendarPage/components/CalendarQuietDay/CalendarQuietDay';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { CalendarWeekProps } from './CalendarWeek.types';

const DAY_STEP = 0.04;

const ENTRY_LEAD = 0.12;

const ENTRY_STEP = 0.05;

/**
 * The release calendar a week at a time: a card for each day, Monday first, side by side where
 * there is room and one under another where there is not, arriving one after another. A day with
 * nothing on it says so.
 *
 * @param day - Any day of the week shown.
 * @param today - Today, which is marked.
 * @param entries - What is released that week.
 * @param onOpen - Opens an entry.
 */
const CalendarWeek = ({ day, today, entries, onOpen }: CalendarWeekProps) => {
  const isStill = useReducedMotionConfig() === true;
  const first = startOfWeek(day);
  const days = Array.from({ length: 7 }, (_, offset) => addDays(first, offset));

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((date, at) => {
        const onIt = entries.filter((entry) => entry.date === date);
        const isToday = date === today;
        const wait = at * DAY_STEP;

        return (
          <motion.div
            key={date}
            {...calendarDayArrival(wait, isStill)}
            className="flex min-w-0 rounded-2xl bg-surface transition-shadow duration-[var(--duration-fast)] hover:ring-1 hover:ring-text/60"
          >
            <PanelCard
              title={isToday ? say('common.today') : nameTheShortDay(date)}
              isFlush
              isCompact
              isHighlighted={isToday}
              className="min-h-24 w-full min-w-0 md:min-h-80"
            >
              <div className={cn('flex min-h-0 flex-1 flex-col', date < today ? 'opacity-70' : '')}>
                <AnimatePresence initial={!isStill} mode="wait">
                  {onIt.length === 0 ? (
                    <CalendarQuietDay key="quiet" />
                  ) : (
                    <ul key="entries" className="flex flex-col gap-0.5 p-1">
                      <AnimatePresence initial={!isStill}>
                        {onIt.map((entry, index) => (
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
  );
};

CalendarWeek.displayName = 'CalendarWeek';

export { CalendarWeek };
