import { say } from '@ValenceI18n/say';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

/**
 * The choices the calendar can be narrowed by: films or shows, what the library holds or what was
 * asked for, and, for somebody who may see them, everybody's requests rather than their own.
 *
 * Each is a single choice that can be left unmade, which keeps everything.
 *
 * @param maySeeEveryone - Whether the viewer may see everybody's requests.
 * @returns The groups of choices.
 */
const describeCalendarFilters = (maySeeEveryone: boolean): FilterGroup[] => [
  {
    name: say('common.kind'),
    isSingle: true,
    options: [
      { id: 'kind:films', label: say('common.films') },
      { id: 'kind:shows', label: say('common.shows') },
    ],
  },
  {
    name: say('screens.calendar.describeCalendarFilters.libraryOrRequests'),
    isSingle: true,
    options: [
      { id: 'from:library', label: say('common.inTheLibrary') },
      { id: 'from:requests', label: say('common.requested') },
    ],
  },
  ...(maySeeEveryone
    ? [
        {
          name: say('screens.calendar.describeCalendarFilters.whoseRequests'),
          isSingle: true,
          options: [{ id: 'who:everyone', label: say('common.everyone') }],
        },
      ]
    : []),
];

export { describeCalendarFilters };
