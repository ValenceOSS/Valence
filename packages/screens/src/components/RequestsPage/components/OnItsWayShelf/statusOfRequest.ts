import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaCardBadge } from '@ValenceUI/MediaCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Where one of the requests on its way stands, as the badge on its card: in the tone a request's
 * state is drawn in everywhere else, and saying how far its downloads have got where it is
 * downloading.
 *
 * @param request - The request.
 * @param going - How its downloads are going, where any are.
 * @returns The badge.
 */
const statusOfRequest = (request: MediaRequest, going: RequestProgress | null): MediaCardBadge => {
  const badge = describeRequestBadge(request);

  return {
    tone: badge.tone,
    label:
      going === null
        ? badge.label
        : say('screens.requestsPage.onItsWayShelf.statusPercent', {
            status: badge.label,
            percent: Math.round(going.progress * 100).toString(),
          }),
  };
};

export { statusOfRequest };
