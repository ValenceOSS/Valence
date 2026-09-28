const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Says how long until something happens, to the second when it is under an hour away and more
 * coarsely beyond that, where seconds would only flicker.
 *
 * @param remaining - Milliseconds until it happens.
 * @returns The wait, such as "in 4m 07s", "in 5h 12m" or "in 3d 4h".
 */
const describeCountdown = (remaining: number): string => {
  if (remaining < SECOND) {
    return 'Due now';
  }

  const pad = (value: number): string => value.toString().padStart(2, '0');

  if (remaining < HOUR) {
    return `in ${Math.floor(remaining / MINUTE).toString()}m ${pad(Math.floor((remaining % MINUTE) / SECOND))}s`;
  }

  if (remaining < DAY) {
    return `in ${Math.floor(remaining / HOUR).toString()}h ${pad(Math.floor((remaining % HOUR) / MINUTE))}m`;
  }

  return `in ${Math.floor(remaining / DAY).toString()}d ${Math.floor((remaining % DAY) / HOUR).toString()}h`;
};

export { describeCountdown };
