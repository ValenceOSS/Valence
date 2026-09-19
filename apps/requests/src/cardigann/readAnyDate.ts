import { MONTHS } from '@ValenceRequests/cardigann/MONTHS';
import { readRelativeTime } from '@ValenceRequests/cardigann/readRelativeTime';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_MS = 86_400_000;

/**
 * Reads a time of day, such as "14:22", "2:22 pm" or "14:22:05", as milliseconds into the day.
 *
 * @param text - What is left once the day has been read.
 * @returns The time, or null where it is not one.
 */
const timeOfDay = (text: string): number | null => {
  const trimmed = text.trim();

  if (trimmed === '') {
    return 0;
  }

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i.exec(trimmed);

  if (match === null) {
    return null;
  }

  const hour =
    (Number(match[1]) % (match[4] === undefined ? 24 : 12)) +
    (match[4]?.toLowerCase().startsWith('p') === true ? 12 : 0);

  return ((hour * 60 + Number(match[2])) * 60 + Number(match[3] ?? 0)) * 1000;
};

/**
 * Reads a date written with numbers alone, such as 05/03/2024 or 2024.03.05 14:30.
 *
 * @param text - What the site wrote.
 * @param isDayFirst - Whether 05/03 is the fifth of March rather than the third of May.
 * @returns The moment, or null.
 */
const numericDate = (text: string, isDayFirst: boolean): number | null => {
  const match = /^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})(?:[\sT,]+(.+))?$/.exec(text);

  if (match === null) {
    return null;
  }

  const [, first = '', second = '', third = '', rest = ''] = match;
  const isYearFirst = first.length === 4;
  const year = Number(isYearFirst ? first : third);
  const fullYear = year < 100 ? 2000 + year : year;
  const month = Number(isYearFirst ? second : isDayFirst ? second : first);
  const day = Number(isYearFirst ? third : isDayFirst ? first : second);
  const time = timeOfDay(rest.replace(/\s*(Z|UTC|GMT)$/i, ''));

  return time === null || month < 1 || month > 12 || day < 1 || day > 31
    ? null
    : Date.UTC(fullYear, month - 1, day) + time;
};

/**
 * Reads a publish date however a site wrote it, which is the whole point of this function: a unix
 * time, "now", "3 hours ago", "Today 14:22", "Yesterday at 2:22 pm", "Saturday at 14:22", "01-31",
 * "1 Jan 10:30", 05/03/2024, or anything the platform's own date reader understands.
 *
 * Dates with no offset are read as UTC. Numeric dates are read month first unless told otherwise,
 * which is what sites mean unless their definition says `UK`.
 *
 * @param text - What the site wrote.
 * @param nowMs - The time now.
 * @param isDayFirst - Whether a numeric date puts the day first.
 * @returns The moment, or null where it could not be read.
 */
const readAnyDate = (text: string, nowMs: number, isDayFirst = false): Date | null => {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const today = Math.floor(nowMs / DAY_MS) * DAY_MS;

  if (trimmed === '') {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const stamp = Number(trimmed);

    return new Date(trimmed.length >= 13 ? stamp : stamp * 1000);
  }

  if (lower.includes('now') || /\bago\b/.test(lower)) {
    return readRelativeTime(lower, nowMs);
  }

  const relativeDay = /^(today|yesterday|tomorrow)[\s,]*(?:at)?\s*(.*)$/.exec(lower);

  if (relativeDay !== null) {
    const time = timeOfDay(relativeDay[2] ?? '');
    const shift = relativeDay[1] === 'yesterday' ? -1 : relativeDay[1] === 'tomorrow' ? 1 : 0;

    return time === null ? null : new Date(today + shift * DAY_MS + time);
  }

  const weekday = /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+at\s+(.*)$/.exec(
    lower,
  );

  if (weekday !== null) {
    const time = timeOfDay(weekday[2] ?? '');
    const back = (new Date(today).getUTCDay() - DAYS.indexOf(weekday[1] ?? '') + 7) % 7;

    return time === null ? null : new Date(today - back * DAY_MS + time);
  }

  const year = new Date(nowMs).getUTCFullYear().toString();
  const monthDay = /^(\d{1,2})-(\d{1,2})(\s.*)?$/.exec(trimmed);
  const withYear =
    monthDay !== null
      ? `${year}-${monthDay[1] ?? ''}-${monthDay[2] ?? ''}${monthDay[3] ?? ''}`
      : trimmed.replace(/^(\d{1,2}\s+[A-Za-z]{3,})\s+(\d{1,2}:\d{2}.*)$/, `$1 ${year} $2`);

  const numeric = numericDate(withYear, isDayFirst);

  if (numeric !== null) {
    return new Date(numeric);
  }

  const hasZone =
    /(Z|UTC|GMT|[+-]\d{2}:?\d{2})$/i.test(withYear) || /T\d{2}:\d{2}.*[+-]\d{2}/.test(withYear);
  const parsed = Date.parse(hasZone ? withYear : `${withYear} UTC`);
  const fallback = Number.isNaN(parsed) ? Date.parse(withYear) : parsed;
  const isNamedMonth = MONTHS.some((month) => lower.includes(month.slice(0, 3)));

  return Number.isNaN(fallback) || (!isNamedMonth && !/\d{4}/.test(withYear))
    ? null
    : new Date(fallback);
};

export { readAnyDate };
