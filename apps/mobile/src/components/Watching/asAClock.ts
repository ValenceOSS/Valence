const AN_HOUR = 3600;

const A_MINUTE = 60;

const twoDigits = (value: number): string => value.toString().padStart(2, '0');

/**
 * A position in a film, the way a clock says it.
 *
 * Hours appear only where there are any, because `0:04:11` on a sitcom reads as a stopwatch and
 * `4:11` reads as a place in an episode. Anything before the beginning reads as the beginning
 * rather than as a negative time, which is what a player asked where it is before it knows.
 *
 * @param seconds - How far in.
 * @returns What to write.
 */
const asAClock = (seconds: number): string => {
  const whole = Math.max(Math.floor(seconds), 0);
  const hours = Math.floor(whole / AN_HOUR);
  const minutes = Math.floor((whole % AN_HOUR) / A_MINUTE);
  const rest = whole % A_MINUTE;

  return hours === 0
    ? `${minutes.toString()}:${twoDigits(rest)}`
    : `${hours.toString()}:${twoDigits(minutes)}:${twoDigits(rest)}`;
};

export { asAClock };
