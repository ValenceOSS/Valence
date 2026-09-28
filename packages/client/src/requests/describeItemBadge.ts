import { docsFor } from '@ValenceCore/functions/docsFor';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { describeCalendarDay } from '@ValenceClient/requests/describeCalendarDay';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';

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
            label: 'Not out yet',
            detail: `Out ${describeCalendarDay(item.airDate)}.`,
          }
        : { ...STATUS_LOOK.queued, label: 'Queued to search', detail: null };
    case 'wanted':
      return {
        ...STATUS_LOOK.attention,
        label: 'Wanted',
        detail: item.problem,
        help: docsFor(item.problemCode),
      };
    case 'searching':
      return { ...STATUS_LOOK.working, label: 'Searching', detail: null };
    case 'chosen':
      return { ...STATUS_LOOK.working, label: 'Release chosen', detail: item.releaseTitle };
    case 'downloading':
      return { ...STATUS_LOOK.working, label: 'Downloading', detail: item.releaseTitle };
    case 'filing':
      return {
        ...STATUS_LOOK.working,
        label: 'Filing',
        detail: item.problem,
        help: docsFor(item.problemCode),
      };
    case 'filed':
      return { ...STATUS_LOOK.working, label: 'Filed', detail: null };
    case 'available':
      return { ...STATUS_LOOK.done, label: 'Available', detail: null };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        label: 'Failed',
        detail: item.problem,
        help: docsFor(item.problemCode),
      };
  }
};

export { describeItemBadge };
