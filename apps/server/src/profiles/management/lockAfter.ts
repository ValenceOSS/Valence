const LOCKS_MS = [60_000, 5 * 60_000, 15 * 60_000] as const;

const LONGEST_LOCK_MS = 60 * 60_000;

const TRIES_BETWEEN_LOCKS = 5;

/**
 * How long a profile's PIN stops being tried after a wrong one: not at all until five in a row,
 * then a minute, then five, fifteen and an hour after each five more, so guessing a four-digit PIN
 * takes months rather than a day.
 *
 * @param failures - How many wrong PINs in a row, counting this one.
 * @param nowMs - The time now.
 * @returns When tries may start again, or nothing where they may go on.
 */
const lockAfter = (failures: number, nowMs: number): Date | null => {
  if (failures === 0 || failures % TRIES_BETWEEN_LOCKS !== 0) {
    return null;
  }

  return new Date(nowMs + (LOCKS_MS[failures / TRIES_BETWEEN_LOCKS - 1] ?? LONGEST_LOCK_MS));
};

export { lockAfter };
