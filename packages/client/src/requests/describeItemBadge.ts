import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { describeCalendarDay } from '@ValenceClient/requests/describeCalendarDay';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { say } from '@ValenceI18n/say';
import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';

/**
 * Says where one episode or album of a request has got to, as a badge and the line beneath it.
 *
 * @param item - The episode or album.
 * @param today - What to treat as today, as `YYYY-MM-DD`, so the phrasing can be tested.
 * @returns The badge's words, tone and line.
 */
const describeItemBadge = (
  item: RequestItem,
  today = new Date().toISOString().slice(0, 10),
): StateBadge => {
  switch (item.state) {
    case 'waiting':
      return item.airDate !== null && item.airDate > today
        ? {
            ...STATUS_LOOK.queued,
            tone: 'quiet',
            label: say('common.notOutYet'),
            detail: say('client.requests.describeItemBadge.outAirDate', {
              airDate: describeCalendarDay(item.airDate),
            }),
          }
        : { ...STATUS_LOOK.queued, label: say('common.queuedToSearch'), detail: null };
    case 'wanted':
      return {
        ...STATUS_LOOK.attention,
        label: REQUEST_STATE_NAMES.wanted,
        detail: item.problem === null ? null : sayAgain(item.problem),
        help: docsFor(item.problemCode),
      };
    case 'searching':
      return { ...STATUS_LOOK.working, label: say('common.searching'), detail: null };
    case 'chosen':
      return {
        ...STATUS_LOOK.working,
        label: REQUEST_STATE_NAMES.chosen,
        detail: item.releaseTitle,
      };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: say('common.downloading'),
        detail: item.releaseTitle,
      };
    case 'filing':
      return {
        ...STATUS_LOOK.working,
        label: say('common.filing'),
        detail: item.problem === null ? null : sayAgain(item.problem),
        help: docsFor(item.problemCode),
      };
    case 'filed':
      return { ...STATUS_LOOK.working, label: REQUEST_STATE_NAMES.filed, detail: null };
    case 'available':
      return { ...STATUS_LOOK.done, label: REQUEST_STATE_NAMES.available, detail: null };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        label: say('common.failed'),
        detail: item.problem === null ? null : sayAgain(item.problem),
        help: docsFor(item.problemCode),
      };
  }
};

export { describeItemBadge };
