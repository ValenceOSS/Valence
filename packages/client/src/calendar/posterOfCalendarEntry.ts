import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Where the poster of something on the release calendar is: the library's own, where the library
 * holds it, or the catalogue's, where it was only asked for.
 *
 * @param entry - What is released.
 * @returns Where its poster is, or null where it has none.
 */
const posterOfCalendarEntry = (entry: CalendarEntry): string | null =>
  entry.artworkMediaId === null ? entry.posterUrl : artworkUrl(entry.artworkMediaId, 'poster');

export { posterOfCalendarEntry };
