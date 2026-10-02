import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { CalendarArrival } from '@ValenceScreens/components/CalendarPage/components/CalendarArrival/CalendarArrival';
import { CalendarEntryRow } from '@ValenceScreens/components/CalendarPage/components/CalendarEntryRow/CalendarEntryRow';
import { CalendarQuietDay } from '@ValenceScreens/components/CalendarPage/components/CalendarQuietDay/CalendarQuietDay';
import { CalendarDayGrid } from '@ValenceScreens/components/CalendarPage/components/CalendarDayGrid/CalendarDayGrid';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { CalendarMonthNarrowProps } from './CalendarMonthNarrow.types';

const ENTRY_STEP = 0.05;

/**
 * The release calendar a month at a time where there is no room for a card a day: a small month of
 * dates, each dotted for what comes out on it, with a card listing everything on the day picked —
 * beneath it on a phone, and beside it on a tablet or a narrow window.
 *
 * @param day - The day picked, which also says which month is shown.
 * @param today - Today, which is marked.
 * @param entries - What is released in the weeks shown.
 * @param onOpen - Opens an entry.
 * @param onPick - Picks a day.
 */
const CalendarMonthNarrow = ({ day, today, entries, onOpen, onPick }: CalendarMonthNarrowProps) => {
  const isStill = useReducedMotionConfig() === true;
  const counts = useMemo(() => {
    const counted = new Map<string, number>();

    for (const entry of entries) {
      counted.set(entry.date, (counted.get(entry.date) ?? 0) + 1);
    }

    return counted;
  }, [entries]);
  const onTheDay = entries.filter((entry) => entry.date === day);

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start md:gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="rounded-2xl bg-surface md:sticky md:top-24">
        <div className="valence-card-shell">
          <CalendarDayGrid
            month={day}
            picked={day}
            today={today}
            counts={counts}
            isArriving
            onPick={onPick}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={day}
          initial={isStill ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          className="rounded-2xl bg-surface"
        >
          <PanelCard title={nameTheDay(day, today)} isFlush isCompact isHighlighted={day === today}>
            {onTheDay.length === 0 ? (
              <div className="flex min-h-24 flex-col">
                <CalendarQuietDay />
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 p-1.5">
                {onTheDay.map((entry, index) => (
                  <CalendarArrival key={`${entry.id}:${entry.date}`} delay={index * ENTRY_STEP}>
                    <CalendarEntryRow entry={entry} onOpen={onOpen} />
                  </CalendarArrival>
                ))}
              </ul>
            )}
          </PanelCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

CalendarMonthNarrow.displayName = 'CalendarMonthNarrow';

export { CalendarMonthNarrow };
