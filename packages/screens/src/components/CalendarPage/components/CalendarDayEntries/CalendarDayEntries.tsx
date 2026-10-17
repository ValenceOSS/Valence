import { AnimatePresence, useReducedMotionConfig } from 'motion/react';
import { CalendarArrival } from '@ValenceScreens/components/CalendarPage/components/CalendarArrival/CalendarArrival';
import { CalendarEntryRow } from '@ValenceScreens/components/CalendarPage/components/CalendarEntryRow/CalendarEntryRow';
import { CalendarQuietDay } from '@ValenceScreens/components/CalendarPage/components/CalendarQuietDay/CalendarQuietDay';
import type { CalendarDayEntriesProps } from './CalendarDayEntries.types';

const ENTRY_LEAD = 0.12;

const ENTRY_STEP = 0.05;

/**
 * What one day of the calendar holds, the same in a week and in a month: its entries, each arriving
 * a moment after the one before once the day itself has, or a quiet note where it holds none.
 *
 * @param entries - What the day holds, as many as there is room to show.
 * @param wait - How long after the page the day itself arrives, in seconds.
 * @param onOpen - Opens an entry.
 */
const CalendarDayEntries = ({ entries, wait, onOpen }: CalendarDayEntriesProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <AnimatePresence initial={!isStill} mode="wait">
      {entries.length === 0 ? (
        <CalendarQuietDay key="quiet" />
      ) : (
        <ul key="entries" className="flex flex-col gap-0.5 p-1">
          <AnimatePresence initial={!isStill}>
            {entries.map((entry, index) => (
              <CalendarArrival key={entry.id} delay={wait + ENTRY_LEAD + index * ENTRY_STEP}>
                <CalendarEntryRow entry={entry} onOpen={onOpen} isCompact />
              </CalendarArrival>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </AnimatePresence>
  );
};

CalendarDayEntries.displayName = 'CalendarDayEntries';

export { CalendarDayEntries };
