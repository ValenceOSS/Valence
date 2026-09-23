import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

/**
 * A group of choices, left out where there is nothing to choose between.
 *
 * @param name - What the group narrows by.
 * @param options - The choices.
 * @returns The group, or nothing where one choice would narrow nothing.
 */
const groupOf = (name: string, options: { id: string; label: string }[]): FilterGroup[] =>
  options.length < 2 ? [] : [{ name, options }];

/**
 * Works out what the requests can be narrowed by: every kind of thing that can be asked for, and
 * then, taken from the requests themselves, the places they have got to, the libraries they are
 * for, who asked for them and the quality each is judged at.
 *
 * Taken from the requests rather than from every library or account there is, so nobody is offered
 * a choice that would empty the list. A group with only one choice is left out entirely for the
 * same reason: ticking it narrows nothing, so it is a control that does nothing.
 *
 * @param requests - Every request.
 * @param libraryNames - What each library is called, by its id.
 * @returns The groups to offer.
 */
const describeRequestFilters = (
  requests: readonly MediaRequest[],
  libraryNames: ReadonlyMap<string, string> = new Map(),
): FilterGroup[] => {
  const sorted = (labels: Iterable<string>) => [...new Set(labels)].toSorted();

  return [
    {
      name: 'Kind',
      options: Object.entries(REQUEST_KIND_NAMES).map(([id, label]) => ({
        id: `kind:${id}`,
        label,
      })),
    },
    {
      name: 'Where it is',
      options: sorted(requests.map((request) => describeRequestBadge(request).label)).map(
        (label) => ({ id: `state:${label}`, label }),
      ),
    },
    ...groupOf(
      'Library',
      [...new Set(requests.map((request) => request.libraryId))]
        .map((id) => ({
          id: `library:${id}`,
          label: libraryNames.get(id) ?? 'A library that has gone',
        }))
        .toSorted((left, right) => left.label.localeCompare(right.label)),
    ),
    ...groupOf(
      'Asked by',
      [...new Map(requests.map((request) => [request.requestedBy.id, request.requestedBy.name]))]
        .map(([id, name]) => ({ id: `who:${id}`, label: name }))
        .toSorted((left, right) => left.label.localeCompare(right.label)),
    ),
    ...groupOf(
      'Quality',
      sorted(requests.map((request) => request.profileName ?? '')).map((name) => ({
        id: `quality:${name}`,
        label: name === '' ? 'No quality set' : name,
      })),
    ),
  ];
};

export { describeRequestFilters };
