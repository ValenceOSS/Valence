import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaCardMeter } from '@ValenceUI/MediaCard.types';
import type { StatusTone } from '@ValenceClient/status/StatusTone';
import { say } from '@ValenceI18n/say';

const TONES: Readonly<Record<StatusTone, MediaCardMeter['tone']>> = {
  quiet: 'quiet',
  waiting: 'accent',
  busy: 'busy',
  warning: 'highlight',
  success: 'success',
  danger: 'danger',
};

/**
 * The bar under one of your requests on its way: coloured by where it stands, and filled to how
 * much of it has come: how far its downloads are where it is downloading, how much of it is here
 * where some is, and full otherwise, so a request waiting on approval still shows its colour.
 *
 * @param request - The request.
 * @param going - How its downloads are going, where any are.
 * @returns The bar.
 */
const meterOfRequest = (request: MediaRequest, going: RequestProgress | null): MediaCardMeter => {
  const badge = describeRequestBadge(request);
  const asked = request.items.filter((item) => item.state !== 'waiting');
  const here = asked.filter((item) => item.state === 'filed' || item.state === 'available');
  const fraction =
    going !== null
      ? going.progress
      : here.length > 0 && asked.length > 0
        ? here.length / asked.length
        : 1;
  const percent = Math.round(fraction * 100);

  return {
    fraction,
    tone: TONES[badge.tone],
    label:
      going !== null
        ? say('screens.requestsPage.onItsWayShelf.statusPercent', {
            status: badge.label,
            percent: percent.toString(),
          })
        : badge.label,
  };
};

export { meterOfRequest };
