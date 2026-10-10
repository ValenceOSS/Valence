import { addDays } from '@ValenceCore/functions/addDays';
import { startOfWeek } from '@ValenceCore/functions/startOfWeek';

const WEEKS_SHOWN = 5;

/**
 * Every day the calendar's timeline draws, as YYYY-MM-DD: five whole weeks from the Monday of the
 * week before the day it is turned to, so what has just come out stays in view beside what is
 * coming.
 *
 * @param day - The day the calendar is turned to.
 * @returns The thirty-five days, in order.
 */
const timelineDaysOf = (day: string): string[] => {
  const first = addDays(startOfWeek(day), -7);

  return Array.from({ length: WEEKS_SHOWN * 7 }, (_, index) => addDays(first, index));
};

export { timelineDaysOf };
