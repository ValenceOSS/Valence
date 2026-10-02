import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { groupCalendarByDay } from '@ValenceClient/calendar/groupCalendarByDay';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { calendarDayArrival } from '@ValenceScreens/calendar/calendarDayArrival';
import { CalendarArrival } from '@ValenceScreens/components/CalendarPage/components/CalendarArrival/CalendarArrival';
import { CalendarUpcomingCard } from '@ValenceScreens/components/CalendarPage/components/CalendarUpcomingCard/CalendarUpcomingCard';
import type { CalendarUpcomingProps } from './CalendarUpcoming.types';

const DAY_STEP = 0.07;

const DAY_CEILING = 0.5;

const ENTRY_LEAD = 0.08;

const ENTRY_STEP = 0.045;

/**
 * The release calendar as a list of what is coming, laid out as the requests page lays out
 * requests: a heading for each day with anything on it, and a card beneath it for each thing,
 * the days arriving one after another and their cards just behind them.
 *
 * @param entries - What is coming, in order.
 * @param today - Today, so it and tomorrow are called by name.
 * @param onOpen - Opens an entry.
 */
const CalendarUpcoming = ({ entries, today, onOpen }: CalendarUpcomingProps) => {
  const isStill = useReducedMotionConfig() === true;
  const me = useQuery(sessionQueries.who());

  return (
    <div className="flex flex-col gap-8">
      <AnimatePresence initial={!isStill}>
        {groupCalendarByDay(entries).map((day, at) => {
          const wait = Math.min(at * DAY_STEP, DAY_CEILING);

          return (
            <motion.div key={day.date} {...calendarDayArrival(wait, isStill)} exit={{ opacity: 0 }}>
              <HeadedSection title={nameTheDay(day.date, today)}>
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={!isStill}>
                    {day.entries.map((entry, index) => (
                      <CalendarArrival
                        key={`${entry.id}:${entry.date}`}
                        delay={wait + ENTRY_LEAD + index * ENTRY_STEP}
                      >
                        <CalendarUpcomingCard
                          entry={entry}
                          myId={me.data?.id ?? null}
                          onOpen={onOpen}
                        />
                      </CalendarArrival>
                    ))}
                  </AnimatePresence>
                </ul>
              </HeadedSection>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

CalendarUpcoming.displayName = 'CalendarUpcoming';

export { CalendarUpcoming };
