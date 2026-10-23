import { readAssTimestamp } from '@ValenceCore/functions/toWebVtt';
import type { TimedPart } from './joinWebVtt';

const A_SECTION = /^\[(?<name>.+)\]\s*$/;

const AN_EVENT = /^(?:Dialogue|Comment):/;

/**
 * Writes a position as Advanced SubStation writes one, in hundredths of a second.
 *
 * @param seconds - The position.
 * @returns The timestamp, such as `1:02:03.45`.
 */
const writeAssTimestamp = (seconds: number): string => {
  const whole = Math.max(Math.round(seconds * 100), 0);
  const pad = (value: number): string => value.toString().padStart(2, '0');

  return `${Math.floor(whole / 360_000).toString()}:${pad(Math.floor(whole / 6000) % 60)}:${pad(
    Math.floor(whole / 100) % 60,
  )}.${pad(whole % 100)}`;
};

/**
 * One script's lines with every event in its events section moved on by some seconds, read by the
 * columns its own `Format:` line names.
 *
 * @param script - The script.
 * @param offsetSeconds - How far to move each event.
 * @returns Its lines, each event moved, with the span of its events section.
 */
const shiftScript = (
  script: string,
  offsetSeconds: number,
): { lines: string[]; events: string[]; endOfEvents: number } => {
  const lines = script.replaceAll('\r\n', '\n').split('\n');
  const events: string[] = [];
  let section = '';
  let columns: string[] = [];
  let endOfEvents = lines.length;

  const shifted = lines.map((line, at) => {
    const heading = A_SECTION.exec(line.trim());

    if (heading !== null) {
      if (section === 'events') {
        endOfEvents = at;
      }

      section = (heading.groups?.['name'] ?? '').toLowerCase();

      return line;
    }

    if (section !== 'events') {
      return line;
    }

    if (line.startsWith('Format:')) {
      columns = line
        .slice(line.indexOf(':') + 1)
        .split(',')
        .map((column) => column.trim().toLowerCase());

      return line;
    }

    const isEvent = AN_EVENT.test(line);
    const start = columns.indexOf('start');
    const end = columns.indexOf('end');

    if (!isEvent || start === -1 || end === -1) {
      return line;
    }

    if (offsetSeconds === 0) {
      events.push(line);

      return line;
    }

    const colon = line.indexOf(':') + 1;
    const fields = line.slice(colon).split(',');

    for (const column of [start, end]) {
      const field = fields[column] ?? '';
      const read = readAssTimestamp(field);

      if (read !== null) {
        fields[column] =
          `${field.slice(0, field.length - field.trimStart().length)}${writeAssTimestamp(read + offsetSeconds)}`;
      }
    }

    const moved = `${line.slice(0, colon)}${fields.join(',')}`;

    events.push(moved);

    return moved;
  });

  return { lines: shifted, events, endOfEvents };
};

/**
 * Joins the Advanced SubStation scripts of a film's parts into one script for the whole film: the
 * first part's script, its styles and header kept, with every later part's events moved on by how
 * long the parts before it play and added to the end of its events.
 *
 * @param parts - Each part's script, in order, with where that part starts in the film.
 * @returns The one script.
 */
const joinAdvancedSubStation = (parts: readonly TimedPart[]): string => {
  const [first, ...later] = parts.map(({ content, offsetSeconds }) =>
    shiftScript(content, offsetSeconds),
  );

  if (first === undefined) {
    return '';
  }

  const added = later.flatMap((one) => one.events);
  const before = first.lines.slice(0, first.endOfEvents);
  const after = first.lines.slice(first.endOfEvents);
  const trailing = before.length - before.findLastIndex((line) => line.trim() !== '') - 1;

  return [
    ...before.slice(0, before.length - trailing),
    ...added,
    ...before.slice(before.length - trailing),
    ...after,
  ].join('\n');
};

export { joinAdvancedSubStation };
