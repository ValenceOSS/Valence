const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

/**
 * How long is left, broken into the few numbers worth saying: minutes under an hour, hours and
 * minutes under a day, and days beyond that, rounded the way a person would say them.
 *
 * @param seconds - How long is left.
 * @returns Each number with its unit, or nothing where it is under a minute.
 */
const partsOfTimeLeft = (seconds: number): { value: number; unit: string }[] | null => {
  if (seconds < MINUTE) {
    return null;
  }

  if (seconds < HOUR) {
    return [{ value: Math.round(seconds / MINUTE), unit: 'min' }];
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    if (minutes === 0 || minutes === 60) {
      return [{ value: hours + (minutes === 60 ? 1 : 0), unit: 'h' }];
    }

    return [
      { value: hours, unit: 'h' },
      { value: minutes, unit: 'min' },
    ];
  }

  const days = Math.round(seconds / DAY);

  return [{ value: days, unit: days === 1 ? 'day' : 'days' }];
};

export { partsOfTimeLeft };
