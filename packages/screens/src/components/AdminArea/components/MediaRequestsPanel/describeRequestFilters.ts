import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { describeRequestBadge } from './describeRequestBadge';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

/**
 * Works out what the requests can be narrowed by: every kind of thing that can be asked for, and
 * the places requests have got to among the ones that are there, so nobody is offered a status
 * nothing is in.
 *
 * @param requests - Every request.
 * @returns The choices, in a group for kind and one for where it is.
 */
const describeRequestFilters = (requests: readonly MediaRequest[]): FilterGroup[] => [
  {
    name: 'Kind',
    options: Object.entries(REQUEST_KIND_NAMES).map(([id, label]) => ({ id: `kind:${id}`, label })),
  },
  {
    name: 'Where it is',
    options: [...new Set(requests.map((request) => describeRequestBadge(request).label))]
      .toSorted()
      .map((label) => ({ id: `state:${label}`, label })),
  },
];

export { describeRequestFilters };
