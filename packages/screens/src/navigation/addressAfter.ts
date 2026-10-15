import { writeLocation } from '@ValenceClient/navigation/readLocation';
import type { Place } from '@ValenceClient/navigation/readLocation';

const PAGE_SCOPED: Partial<Place> = { search: '', genre: null, filters: null, library: null };

/**
 * The address a move from one place leads to. Moving to another section leaves behind what belonged
 * to the page being left — what was typed, the genre and filters chosen, the library narrowed to —
 * unless the move says them itself, so a filter chosen on one page does not quietly narrow the next.
 *
 * @param place - Where the application is.
 * @param change - What the move changes.
 * @returns The address it leads to.
 */
const addressAfter = (place: Place, change: Partial<Place>): string => {
  const isLeaving = change.section !== undefined && change.section !== place.section;

  return writeLocation({ ...place, ...(isLeaving ? PAGE_SCOPED : {}), ...change });
};

export { addressAfter };
