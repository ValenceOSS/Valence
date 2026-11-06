const CLOCK = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2}(?:\.\d+)?)$/u;

/**
 * Reads a time written as a clock reads, such as 1:02:03, 2:03 or 45, as how many seconds it is.
 *
 * @param typed - The time as typed.
 * @returns The seconds, or nothing where it is not a time.
 */
const secondsOfClock = (typed: string): number | null => {
  const read = CLOCK.exec(typed.trim());

  if (read === null) {
    return null;
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = read;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

export { secondsOfClock };
