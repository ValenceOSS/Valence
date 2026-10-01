/**
 * Whether an hour of the day falls inside a span of hours, which may run past midnight: from one
 * until six holds three, and from ten until two holds eleven and one. A span that starts and ends
 * on the same hour is the whole day.
 *
 * @param hour - The hour to ask about, nought to twenty-three.
 * @param startHour - The hour the span begins, which it includes.
 * @param endHour - The hour the span ends, which it does not include.
 * @returns Whether the hour is inside it.
 */
const isWithinHours = (hour: number, startHour: number, endHour: number): boolean => {
  if (startHour === endHour) {
    return true;
  }

  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
};

export { isWithinHours };
