import { motion, useReducedMotionConfig } from 'motion/react';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheWeekday } from '@ValenceClient/calendar/nameTheWeekday';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { calendarDayArrival } from '@ValenceScreens/calendar/calendarDayArrival';
import type { CalendarDayGridProps } from './CalendarDayGrid.types';

const DOTS_A_DAY = 3;

const DAY_STEP = 0.015;

const NO_COUNTS: ReadonlyMap<string, number> = new Map();

/**
 * A month of dates, Monday first, to pick a day from: the one picked filled in the accent, today
 * written in it, the days either side of the month faded, and each dotted for what comes out on it
 * where that is known.
 *
 * @param month - Any day of the month shown.
 * @param picked - The day picked, where one is.
 * @param today - Today, which is marked.
 * @param counts - How much comes out on each day, for its dots.
 * @param isArriving - Whether the days wash in from the top-left as it appears.
 * @param onPick - Told which day was pressed.
 */
const CalendarDayGrid = ({
  month,
  picked,
  today,
  counts = NO_COUNTS,
  isArriving = false,
  onPick,
}: CalendarDayGridProps) => {
  const isStill = useReducedMotionConfig() === true || !isArriving;
  const grid = monthGridOf(month);
  const shown = month.slice(0, 7);

  return (
    <div className="grid grid-cols-7 gap-y-1">
      {grid.slice(0, 7).map((date) => (
        <span
          key={date}
          aria-hidden
          className="py-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted"
        >
          {nameTheWeekday(date)}
        </span>
      ))}

      {grid.map((date, at) => {
        const count = counts.get(date) ?? 0;
        const isPicked = date === picked;
        const isToday = date === today;
        const isThisMonth = date.slice(0, 7) === shown;

        return (
          <motion.div
            key={date}
            {...calendarDayArrival((Math.floor(at / 7) + (at % 7)) * DAY_STEP, isStill)}
            className="flex justify-center"
          >
            <Button
              variant="bare"
              size="none"
              label={nameTheDay(date, today)}
              aria-pressed={isPicked}
              onClick={() => {
                onPick(date);
              }}
            >
              <span
                className={cn(
                  'valence-hoverable relative flex size-10 items-center justify-center rounded-full text-sm tabular-nums',
                  isPicked ? 'bg-accent font-semibold text-accent-contrast' : '',
                  !isPicked && isToday ? 'font-semibold text-accent' : '',
                  !isPicked && !isToday && isThisMonth ? 'text-text' : '',
                  !isPicked && !isToday && !isThisMonth ? 'text-text-muted opacity-50' : '',
                )}
              >
                {Number(date.slice(8, 10))}
                <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {Array.from({ length: Math.min(count, DOTS_A_DAY) }, (_, dot) => (
                    <span
                      key={dot}
                      className={cn(
                        'size-1 rounded-full',
                        isPicked ? 'bg-accent-contrast' : 'bg-text-muted',
                      )}
                    />
                  ))}
                </span>
              </span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};

CalendarDayGrid.displayName = 'CalendarDayGrid';

export { CalendarDayGrid };
