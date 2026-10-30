import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Where the wide picture of something on the release calendar is: the library's own backdrop of the
 * title, where the library holds it — a programme's chosen backdrop rather than the still of the
 * episode that stands for it — or the catalogue's, where it was only asked for, falling back to its
 * poster.
 *
 * @param entry - What is released.
 * @param size - How wide the library's own is drawn, where it is drawn small.
 * @returns Where its picture is, or null where it has none.
 */
const backdropOfCalendarEntry = (
  entry: CalendarEntry,
  size?: keyof typeof ARTWORK_WIDTHS,
): string | null =>
  entry.artworkMediaId === null
    ? (entry.backdropUrl ?? entry.posterUrl)
    : artworkUrl(entry.artworkMediaId, 'backdrop', {
        isOfTitle: true,
        ...(size === undefined ? {} : { size }),
      });

export { backdropOfCalendarEntry };
