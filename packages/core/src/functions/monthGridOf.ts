import { addDays } from '@ValenceCore/functions/addDays';
import { startOfWeek } from '@ValenceCore/functions/startOfWeek';

const WEEKS_SHOWN = 6;

/**
 * Every day a month calendar draws, as YYYY-MM-DD: six whole weeks from the Monday on or before the
 * first of the month, so every month is the same height and nothing jumps as one is turned.
 *
 * @param day - Any day of the month.
 * @returns The forty-two days, in order.
 */
const monthGridOf = (day: string): string[] => {
  const first = startOfWeek(`${day.slice(0, 7)}-01`);

  return Array.from({ length: WEEKS_SHOWN * 7 }, (_, index) => addDays(first, index));
};

export { monthGridOf };
