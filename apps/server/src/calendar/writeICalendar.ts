import { addDays } from '@ValenceCore/functions/addDays';
import type { ICalEvent } from '@ValenceServer/calendar/ICalEvent';

const LINE_OCTETS = 75;

const REFRESH_EVERY = 'PT6H';

const PRODUCT = '-//Valence//Release calendar//EN';

/**
 * Escapes text as iCalendar asks a text value to be written: backslashes, semicolons and commas
 * escaped, and line breaks written as `\n`.
 *
 * @param text - The text.
 * @returns It, escaped.
 */
const escaped = (text: string): string =>
  text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r\n|\r|\n/g, '\\n');

/**
 * Folds a content line at 75 octets, as iCalendar requires, each continuation starting with a
 * space. It folds between characters rather than bytes, so a character written in several bytes
 * is never split across lines.
 *
 * @param line - The line.
 * @returns It, folded.
 */
const folded = (line: string): string => {
  const parts: string[] = [];
  let current = '';
  let octets = 0;

  for (const character of line) {
    const size = Buffer.byteLength(character, 'utf8');
    const room = parts.length === 0 ? LINE_OCTETS : LINE_OCTETS - 1;

    if (octets + size > room) {
      parts.push(current);
      current = '';
      octets = 0;
    }

    current += character;
    octets += size;
  }

  parts.push(current);

  return parts.join('\r\n ');
};

/**
 * Writes a day as iCalendar writes a date: `YYYYMMDD`.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @returns It as iCalendar writes it.
 */
const dateOf = (day: string): string => day.replaceAll('-', '');

/**
 * Writes the release calendar as an iCalendar file a calendar app can subscribe to: each thing out
 * as an all-day event on its day, since an air date is a date and not a time, marked free so it
 * never blocks anybody's diary. The app is asked to read it again every six hours.
 *
 * @param events - What comes out.
 * @param options - What the calendar is called, and when it was written.
 * @returns The file, with lines ending CRLF as the format requires.
 */
const writeICalendar = (
  events: readonly ICalEvent[],
  options: { name: string; stamp: Date },
): string => {
  const stamp = `${options.stamp.toISOString().replaceAll(/[-:]/g, '').slice(0, 15)}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODUCT}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaped(options.name)}`,
    `REFRESH-INTERVAL;VALUE=DURATION:${REFRESH_EVERY}`,
    `X-PUBLISHED-TTL:${REFRESH_EVERY}`,
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${escaped(event.uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateOf(event.date)}`,
      `DTEND;VALUE=DATE:${dateOf(addDays(event.date, 1))}`,
      `SUMMARY:${escaped(event.summary)}`,
      ...(event.description === null ? [] : [`DESCRIPTION:${escaped(event.description)}`]),
      ...(event.url === null ? [] : [`URL:${event.url}`]),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];

  return `${lines.map(folded).join('\r\n')}\r\n`;
};

export { writeICalendar };
