import { docsFor } from '@ValenceCore/functions/docsFor';
import { describeCalendarDay } from '@ValenceClient/requests/describeCalendarDay';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { say } from '@ValenceI18n/say';

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
 * Whether a film, episode or album has come out, by the same rule the worker uses to promote it:
 * one with a day is out on that day, and one with none is out if it is not part of a season.
 *
 * @param item - The film, episode or album.
 * @param today - Today, as a calendar day.
 * @returns Whether it is out.
 */
const isOut = (item: MediaRequest['items'][number], today: string): boolean =>
  item.airDate === null ? item.season === null : item.airDate <= today;

/**
 * Today, as a calendar day.
 *
 * @returns Such as `2026-09-21`.
 */
const calendarToday = (): string => new Date().toISOString().slice(0, 10);

/**
 * Says where a request has got to, as a badge and the line beneath it: what it waits for, what
 * went wrong, or what is on its way.
 *
 * Something that is out but not yet searched for is not "not out yet": a request is approved
 * waiting, and the worker promotes what is out a moment later, so somebody looking in that moment
 * is told it is queued for a search rather than that it has not been released.
 *
 * A book is never searched for, so where it stands is that somebody has yet to add it, rather than
 * that it is queued or wanted.
 *
 * @param request - The request.
 * @param today - Today, as a calendar day, for deciding what has come out.
 * @returns The badge's words and tone, and the line beneath it where there is one.
 */
const describeRequestBadge = (request: MediaRequest, today = calendarToday()): StateBadge => {
  if (
    request.kind === 'book' &&
    (request.state === 'waiting' || request.state === 'wanted' || request.state === 'searching')
  ) {
    return {
      ...STATUS_LOOK.queued,
      label: say('client.describeRequestBadge.bookWaiting'),
      detail: say('client.describeRequestBadge.bookWaitingDetail'),
    };
  }

  switch (request.state) {
    case 'awaitingApproval':
      return {
        ...STATUS_LOOK.attention,
        label: say('client.describeRequestBadge.awaitingApproval'),
        detail: null,
      };
    case 'refused':
      return {
        ...STATUS_LOOK.failed,
        label: say('client.describeRequestBadge.refused'),
        detail: request.refusedBecause,
      };
    case 'waiting': {
      if (request.kind !== 'film' && request.items.length === 0) {
        return {
          ...STATUS_LOOK.working,
          label: say('client.describeRequestBadge.lookingUp'),
          detail: say('client.describeRequestBadge.lookingUpDetail'),
        };
      }

      const isOutNow =
        request.kind === 'film'
          ? request.releaseDate === null || request.releaseDate <= today
          : request.items.some((item) => item.state === 'waiting' && isOut(item, today));

      if (isOutNow) {
        return {
          ...STATUS_LOOK.queued,
          label: say('client.describeRequestBadge.queuedToSearch'),
          detail: say('client.describeRequestBadge.queuedToSearchDetail'),
        };
      }

      if (request.kind === 'film') {
        return {
          ...STATUS_LOOK.queued,
          tone: 'quiet',
          label: say('client.describeRequestBadge.notOutYet'),
          detail:
            request.releaseDate === null
              ? null
              : say('client.describeRequestBadge.heldUntil', {
                  date: describeCalendarDay(request.releaseDate),
                }),
        };
      }

      const next = nextAirDate(request);
      const isMusic = request.kind === 'artist' || request.kind === 'album';

      if (isMusic) {
        return {
          ...STATUS_LOOK.queued,
          tone: 'quiet',
          label: say('client.describeRequestBadge.notOutYet'),
          detail:
            next === null
              ? say('client.describeRequestBadge.nextAlbumUnknown')
              : say('client.describeRequestBadge.albumOut', { date: describeCalendarDay(next) }),
        };
      }

      return {
        ...STATUS_LOOK.queued,
        tone: 'quiet',
        label: say('client.describeRequestBadge.notOutYet'),
        detail:
          next === null
            ? say('client.describeRequestBadge.nextEpisodeUnknown')
            : say('client.describeRequestBadge.nextEpisodeAirs', {
                date: describeCalendarDay(next),
              }),
      };
    }
    case 'wanted':
      return {
        ...STATUS_LOOK.attention,
        label: say('client.describeRequestBadge.wanted'),
        detail:
          request.problem ??
          (request.isPickedByHand
            ? say('client.describeRequestBadge.wantedByHand')
            : say('client.describeRequestBadge.wantedAgain')),
        help: docsFor(request.problemCode),
      };
    case 'searching':
      return {
        ...STATUS_LOOK.working,
        label: say('client.describeRequestBadge.searching'),
        detail: null,
      };
    case 'chosen':
      return {
        ...STATUS_LOOK.working,
        label: say('client.describeRequestBadge.chosen'),
        detail: null,
      };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: say('client.describeRequestBadge.downloading'),
        detail: request.items.find((item) => item.state === 'downloading')?.releaseTitle ?? null,
      };
    case 'filing':
      return {
        ...STATUS_LOOK.working,
        label: say('client.describeRequestBadge.filing'),
        detail: request.problem,
        help: docsFor(request.problemCode),
      };
    case 'filed':
      return {
        ...STATUS_LOOK.working,
        label: say('client.describeRequestBadge.filed'),
        detail: say('client.describeRequestBadge.filedDetail'),
      };
    case 'available':
      return { ...STATUS_LOOK.done, detail: null };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        detail: request.problem ?? say('client.describeRequestBadge.failedDetail'),
        help: docsFor(request.problemCode),
      };
  }
};

export { describeRequestBadge };
