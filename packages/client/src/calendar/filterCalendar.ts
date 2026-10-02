import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarFilter = {
  kinds: 'all' | 'films' | 'shows';
  from: 'all' | 'library' | 'requests';
};

const EVERYTHING: CalendarFilter = { kinds: 'all', from: 'all' };

/**
 * Keeps the entries a viewer has chosen to see: films or shows, and what is already in a library or
 * what has been asked for.
 *
 * An episode held and requested is shown from both sides, since it is in the library and somebody
 * asked for it.
 *
 * @param entries - Every entry.
 * @param filter - What to keep.
 * @returns The entries kept, in the order they came.
 */
const filterCalendar = (
  entries: readonly CalendarEntry[],
  filter: CalendarFilter = EVERYTHING,
): CalendarEntry[] =>
  entries.filter(
    (entry) =>
      (filter.kinds === 'all' || (filter.kinds === 'films') === (entry.episode === null)) &&
      (filter.from === 'all' ||
        (filter.from === 'library'
          ? entry.source === 'library'
          : entry.source === 'request' || entry.requestedBy !== null)),
  );

export type { CalendarFilter };

export { filterCalendar };
