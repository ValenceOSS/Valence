import { describeCalendarDay } from './describeCalendarDay';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceScreens/components/AdminArea/StateBadge';
import { STATUS_LOOK } from '@ValenceScreens/status/STATUS_LOOK';

/**
 * The day the next of a series' episodes airs, or an artist's albums comes out, where the
 * catalogue has said.
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
      return { ...STATUS_LOOK.attention, label: 'Awaiting approval', detail: null };
    case 'refused':
      return { ...STATUS_LOOK.failed, label: 'Refused', detail: request.refusedBecause };
    case 'waiting': {
      if (request.kind === 'film') {
        return {
          ...STATUS_LOOK.queued,
          label: 'Not out yet',
          detail:
            request.releaseDate === null
              ? null
              : `Held until ${describeCalendarDay(request.releaseDate)}, when its quality profile says it is out.`,
        };
      }

      const next = nextAirDate(request);
      const isMusic = request.kind === 'artist' || request.kind === 'album';

      if (isMusic) {
        return {
          ...STATUS_LOOK.queued,
          label: 'Not out yet',
          detail:
            next === null
              ? 'Waiting for the next album to be announced.'
              : `Out ${describeCalendarDay(next)}.`,
        };
      }

      return {
        ...STATUS_LOOK.queued,
        label: 'Not out yet',
        detail:
          next === null
            ? 'Waiting for the next episode to be announced.'
            : `The next episode airs ${describeCalendarDay(next)}.`,
      };
    }
    case 'wanted':
      return {
        ...STATUS_LOOK.attention,
        label: 'Wanted',
        detail:
          request.problem ??
          (request.isPickedByHand
            ? 'Waiting for a release to be picked by hand.'
            : 'Searched for again every few hours.'),
      };
    case 'searching':
      return { ...STATUS_LOOK.working, label: 'Searching', detail: null };
    case 'chosen':
      return { ...STATUS_LOOK.working, label: 'Release chosen', detail: null };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: 'Downloading',
        detail: request.items.find((item) => item.state === 'downloading')?.releaseTitle ?? null,
      };
    case 'filing':
      return { ...STATUS_LOOK.working, label: 'Filing', detail: request.problem };
    case 'filed':
      return {
        ...STATUS_LOOK.working,
        label: 'Filed',
        detail: 'In its library, waiting for the library to find it.',
      };
    case 'available':
      return { ...STATUS_LOOK.done, detail: null };
    case 'failed':
      return { ...STATUS_LOOK.failed, detail: request.problem ?? 'It failed.' };
  }
};

export { describeRequestBadge };
