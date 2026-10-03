import type { CalendarAudience } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarFilter } from '@ValenceClient/calendar/filterCalendar';

/**
 * What the choices made in the calendar's filter menu ask for: which entries to keep, and whose
 * requests to read.
 *
 * @param selected - The choices made, as describeCalendarFilters names them.
 * @param maySeeEveryone - Whether the viewer may see everybody's requests.
 * @returns The filter, and whose requests.
 */
const readCalendarFilters = (
  selected: ReadonlySet<string>,
  maySeeEveryone: boolean,
): { filter: CalendarFilter; who: CalendarAudience } => ({
  filter: {
    kinds: selected.has('kind:films') ? 'films' : selected.has('kind:shows') ? 'shows' : 'all',
    from: selected.has('from:library')
      ? 'library'
      : selected.has('from:requests')
        ? 'requests'
        : 'all',
  },
  who: maySeeEveryone && selected.has('who:everyone') ? 'everyone' : 'mine',
});

export { readCalendarFilters };
