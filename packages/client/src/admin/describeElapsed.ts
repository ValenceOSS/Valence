/**
 * How long something took, in the largest units that still say it plainly — "850 ms", "1.4 s",
 * "2 min 5 s", "1 h 3 min" — rather than a count of milliseconds nobody reads.
 *
 * @param ms - How long it took.
 * @returns The time, in words.
 */
const describeElapsed = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms).toString()} ms`;
  }

  const seconds = ms / 1000;

  if (seconds < 10) {
    return `${(Math.round(seconds * 10) / 10).toString()} s`;
  }

  const whole = Math.round(seconds);

  if (whole < 60) {
    return `${whole.toString()} s`;
  }

  const minutes = Math.floor(whole / 60);

  if (minutes < 60) {
    const rest = whole % 60;

    return rest === 0
      ? `${minutes.toString()} min`
      : `${minutes.toString()} min ${rest.toString()} s`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours.toString()} h` : `${hours.toString()} h ${rest.toString()} min`;
};

export { describeElapsed };
