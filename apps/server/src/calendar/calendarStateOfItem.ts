import type { CalendarState } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { RequestItemState } from '@ValenceContracts/schemas/MediaRequest';

const STATE_OF_ITEM: Readonly<Record<RequestItemState, CalendarState>> = {
  waiting: 'notOutYet',
  wanted: 'wanted',
  failed: 'wanted',
  searching: 'downloading',
  chosen: 'downloading',
  downloading: 'downloading',
  filing: 'downloading',
  filed: 'downloading',
  available: 'available',
};

/**
 * Says where a requested film or episode has got to, in the four words the calendar uses.
 *
 * Kept as one table rather than a chain of checks, so that a request state added later is a type
 * error here rather than an entry the calendar quietly calls wanted.
 *
 * @param state - Where the request has it.
 * @returns What the calendar calls it.
 */
const calendarStateOfItem = (state: RequestItemState): CalendarState => STATE_OF_ITEM[state];

export { calendarStateOfItem };
