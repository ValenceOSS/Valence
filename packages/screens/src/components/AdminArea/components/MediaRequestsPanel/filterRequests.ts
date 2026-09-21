import { describeRequestBadge } from './describeRequestBadge';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Narrows the requests to the ones that match what was typed and what was ticked. Within one group
 * a request need match only one of the ticked choices, since it can only be one kind or in one
 * place; across groups it must match both, so ticking a kind and a place asks for that kind in that
 * place. A group with nothing ticked narrows nothing.
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
  const kinds = [...selected].filter((id) => id.startsWith('kind:')).map((id) => id.slice(5));
  const states = [...selected].filter((id) => id.startsWith('state:')).map((id) => id.slice(6));
  const words = search.trim().toLowerCase();

  return requests.filter(
    (request) =>
      (kinds.length === 0 || kinds.includes(request.kind)) &&
      (states.length === 0 || states.includes(describeRequestBadge(request).label)) &&
      (words === '' ||
        request.title.toLowerCase().includes(words) ||
        request.requestedBy.name.toLowerCase().includes(words)),
  );
};

export { filterRequests };
