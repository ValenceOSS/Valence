import { describeCalendarDay } from './describeCalendarDay';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceScreens/components/AdminArea/StateBadge';

/**
 * The day the next of a series' episodes airs, where the catalogue has said.
 *
 * @param request - The request.
 * @returns The day, or null.
 */
const nextAirDate = (request: MediaRequest): string | null =>
  request.items
    .filter((item) => item.state === 'waiting' && item.airDate !== null)
    .map((item) => item.airDate ?? '')
    .toSorted()[0] ?? null;

/**
 * Says where a request has got to, as a badge and the line beneath it: what it waits for, what
 * went wrong, or what is on its way.
 *
 * @param request - The request.
 * @returns The badge's words and tone, and the line beneath it where there is one.
 */
const describeRequestBadge = (request: MediaRequest): StateBadge => {
  switch (request.state) {
    case 'awaitingApproval':
      return { label: 'Awaiting approval', tone: 'highlight', detail: null };
    case 'refused':
      return { label: 'Refused', tone: 'danger', detail: request.refusedBecause };
    case 'waiting': {
      if (request.kind === 'film') {
        return {
          label: 'Not out yet',
          tone: 'quiet',
          detail:
            request.releaseDate === null
              ? null
              : `Held until ${describeCalendarDay(request.releaseDate)}, when it is out ${request.waitFor === 'digital' ? 'digitally' : 'on disc'}.`,
        };
      }

      const next = nextAirDate(request);

      return {
        label: 'Not out yet',
        tone: 'quiet',
        detail:
          next === null
            ? 'Waiting for the next episode to be announced.'
            : `The next episode airs ${describeCalendarDay(next)}.`,
      };
    }
    case 'wanted':
      return {
        label: 'Wanted',
        tone: 'warning',
        detail: request.problem ?? 'Searched for again every few hours.',
      };
    case 'searching':
      return { label: 'Searching', tone: 'accent', detail: null };
    case 'chosen':
      return { label: 'Release chosen', tone: 'accent', detail: null };
    case 'downloading':
      return {
        label: 'Downloading',
        tone: 'accent',
        detail: request.items.find((item) => item.state === 'downloading')?.releaseTitle ?? null,
      };
    case 'filing':
      return { label: 'Filing', tone: 'highlight', detail: request.problem };
    case 'filed':
      return {
        label: 'Filed',
        tone: 'highlight',
        detail: 'In its library, waiting for the library to find it.',
      };
    case 'available':
      return { label: 'Ready', tone: 'success', detail: null };
    case 'failed':
      return { label: 'Failed', tone: 'danger', detail: request.problem ?? 'It failed.' };
  }
};

export { describeRequestBadge };
