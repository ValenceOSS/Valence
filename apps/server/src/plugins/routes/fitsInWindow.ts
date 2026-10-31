/**
 * Whether one more thing fits within a limit over a window of time, counting it where it does.
 *
 * @param kept - When the earlier ones happened, by key.
 * @param key - Whose limit.
 * @param most - How many fit in the window.
 * @param windowMilliseconds - How long the window is.
 * @param at - The moment it is.
 * @returns Whether it fits.
 */
const fitsInWindow = (
  kept: Map<string, number[]>,
  key: string,
  most: number,
  windowMilliseconds: number,
  at: number,
): boolean => {
  const recent = (kept.get(key) ?? []).filter((moment) => at - moment < windowMilliseconds);

  if (recent.length >= most) {
    kept.set(key, recent);

    return false;
  }

  kept.set(key, [...recent, at]);

  return true;
};

export { fitsInWindow };
