import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Which row of the calendar's timeline an entry belongs on: every episode of a show shares one,
 * as does every release of a film, by its name, so a show held in the library and asked for as
 * well is still one row.
 *
 * @param entry - The entry.
 * @returns The row's key.
 */
const timelineRowKeyOf = (entry: CalendarEntry): string =>
  `${entry.episode === null ? 'film' : 'show'}:${entry.title.trim().toLocaleLowerCase()}`;

export { timelineRowKeyOf };
