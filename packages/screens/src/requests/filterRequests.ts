import { describeRequestBadge } from '@ValenceScreens/components/AdminArea/components/MediaRequestsPanel/describeRequestBadge';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const NOT_JUDGED = 'quality:';

/**
 * The ids ticked within one group, with the group's own prefix taken off.
 *
 * @param selected - Every ticked id.
 * @param prefix - The group's prefix, such as `kind:`.
 * @returns What was ticked in that group.
 */
const tickedIn = (selected: ReadonlySet<string>, prefix: string): string[] =>
  [...selected].filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length));

/**
 * Narrows the requests to the ones that match what was typed and what was ticked. Within one group
 * a request need match only one of the ticked choices, since it can only be one kind or in one
 * place; across groups it must match both, so ticking a kind and a place asks for that kind in that
 * place. A group with nothing ticked narrows nothing.
 *
 * A request judged by no profile answers to the quality group's empty id, so "no quality" can be
 * asked for in the same way as any named one rather than being unaskable.
 *
 * @param requests - Every request.
 * @param selected - The ids of the ticked choices, such as `kind:film` or `state:Filed`.
 * @param search - What was typed, matched against the title and who asked, ignoring case.
 * @returns The requests that remain, in their original order.
 */
const filterRequests = (
  requests: readonly MediaRequest[],
  selected: ReadonlySet<string>,
  search: string,
): MediaRequest[] => {
  const kinds = tickedIn(selected, 'kind:');
  const states = tickedIn(selected, 'state:');
  const libraries = tickedIn(selected, 'library:');
  const askers = tickedIn(selected, 'who:');
  const qualities = tickedIn(selected, NOT_JUDGED);
  const words = search.trim().toLowerCase();

  return requests.filter(
    (request) =>
      (kinds.length === 0 || kinds.includes(request.kind)) &&
      (states.length === 0 || states.includes(describeRequestBadge(request).label)) &&
      (libraries.length === 0 || libraries.includes(request.libraryId)) &&
      (askers.length === 0 || askers.includes(request.requestedBy.id)) &&
      (qualities.length === 0 || qualities.includes(request.profileName ?? '')) &&
      (words === '' ||
        request.title.toLowerCase().includes(words) ||
        request.requestedBy.name.toLowerCase().includes(words)),
  );
};

export { filterRequests };
