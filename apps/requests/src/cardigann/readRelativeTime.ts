const UNITS: readonly (readonly [RegExp, number])[] = [
  [/^(mo|month)/, 30 * 86_400_000],
  [/^(s$|sec)/, 1000],
  [/^(m$|min)/, 60_000],
  [/^(h$|hr|hour)/, 3_600_000],
  [/^(d$|day)/, 86_400_000],
  [/^(w$|wk|week)/, 7 * 86_400_000],
  [/^(y$|yr|year)/, 365 * 86_400_000],
];

/**
 * Reads how long ago a site says something was posted — "2 hours and 1 day", "9hr,12m,39s", "4 years
 * ago", "now" — as the moment it was.
 *
 * @param text - What the site wrote.
 * @param nowMs - The time now.
 * @returns The moment, or null where some part of it is not a length of time.
 */
const readRelativeTime = (text: string, nowMs: number): Date | null => {
  const words = text.toLowerCase();

  if (words.includes('now')) {
    return new Date(nowMs);
  }

  const parts = [...words.replace(/,|\bago\b|\band\b/g, ' ').matchAll(/([\d.]+)\s*([^\d\s.]+)/g)];

  if (parts.length === 0) {
    return null;
  }

  let ago = 0;

  for (const [, amount = '', unit = ''] of parts) {
    const length = UNITS.find(([pattern]) => pattern.test(unit))?.[1];

    if (length === undefined) {
      return null;
    }

    ago += Number(amount) * length;
  }

  return new Date(nowMs - ago);
};

export { readRelativeTime };
