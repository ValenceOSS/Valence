/**
 * Reads a time of day typed as hours and minutes, such as 03:00.
 *
 * @param value - What was typed.
 * @returns The hour and minute, or null where it is not a time of day.
 */
const readClock = (value: string): { hour: number; minute: number } | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  const hour = Number.parseInt(match?.[1] ?? '', 10);
  const minute = Number.parseInt(match?.[2] ?? '', 10);

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return { hour, minute };
};

export { readClock };
