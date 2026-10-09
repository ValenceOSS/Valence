import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { describeCalendarDay } from '@ValenceClient/requests/describeCalendarDay';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';
import { isYetToComeOut } from '@ValenceClient/requests/isYetToComeOut';
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
    .sort()[0] ?? null;

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
  switch (request.state) {
    case 'awaitingApproval':
      return {
        ...STATUS_LOOK.attention,
        label: REQUEST_STATE_NAMES.awaitingApproval,
        detail: null,
      };
    case 'refused':
      return {
        ...STATUS_LOOK.failed,
        label: REQUEST_STATE_NAMES.refused,
        detail: request.refusedBecause === null ? null : sayAgain(request.refusedBecause),
      };
    case 'waiting': {
      if (request.kind !== 'film' && request.items.length === 0) {
        return {
          ...STATUS_LOOK.working,
          label: say('client.requests.describeRequestBadge.lookingItUp'),
          detail: say('client.requests.describeRequestBadge.findingOutWhatThereIsTo'),
        };
      }

      if (!isYetToComeOut(request, today)) {
        return {
          ...STATUS_LOOK.queued,
          label: say('common.queuedToSearch'),
          detail: say('client.requests.describeRequestBadge.itIsOutAndWillBe'),
        };
      }

      if (request.kind === 'film') {
        return {
          ...STATUS_LOOK.queued,
          tone: 'quiet',
          label: say('common.notOutYet'),
          detail:
            request.releaseDate === null
              ? null
              : say('client.requests.describeRequestBadge.heldUntilReleaseDateWhenItsQuality', {
                  releaseDate: describeCalendarDay(request.releaseDate),
                }),
        };
      }

      const next = nextAirDate(request);
      const isMusic = request.kind === 'artist' || request.kind === 'album';

      if (isMusic) {
        return {
          ...STATUS_LOOK.queued,
          tone: 'quiet',
          label: say('common.notOutYet'),
          detail:
            next === null
              ? say('client.requests.describeRequestBadge.waitingForTheNextAlbumTo')
              : say('client.requests.describeRequestBadge.outNext', {
                  next: describeCalendarDay(next),
                }),
        };
      }

      return {
        ...STATUS_LOOK.queued,
        tone: 'quiet',
        label: say('common.notOutYet'),
        detail:
          next === null
            ? say('client.requests.describeRequestBadge.waitingForTheNextEpisodeTo')
            : say('client.requests.describeRequestBadge.theNextEpisodeAirsNext', {
                next: describeCalendarDay(next),
              }),
      };
    }
    case 'wanted':
      return {
        ...STATUS_LOOK.attention,
        label: REQUEST_STATE_NAMES.wanted,
        detail:
          (request.problem === null ? null : sayAgain(request.problem)) ??
          (request.isPickedByHand
            ? say('client.requests.describeRequestBadge.waitingForAReleaseToBe')
            : say('client.requests.describeRequestBadge.searchedForAgainEveryFewHours')),
        help: docsFor(request.problemCode),
      };
    case 'searching':
      return { ...STATUS_LOOK.working, label: REQUEST_STATE_NAMES.searching, detail: null };
    case 'chosen':
      return { ...STATUS_LOOK.working, label: REQUEST_STATE_NAMES.chosen, detail: null };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: REQUEST_STATE_NAMES.downloading,
        detail: request.items.find((item) => item.state === 'downloading')?.releaseTitle ?? null,
      };
    case 'filing':
      return {
        ...STATUS_LOOK.working,
        label: REQUEST_STATE_NAMES.filing,
        detail: request.problem === null ? null : sayAgain(request.problem),
        help: docsFor(request.problemCode),
      };
    case 'filed':
      return {
        ...STATUS_LOOK.working,
        label: REQUEST_STATE_NAMES.filed,
        detail: say('client.requests.describeRequestBadge.inItsLibraryWaitingForThe'),
      };
    case 'available':
      return { ...STATUS_LOOK.done, label: REQUEST_STATE_NAMES.available, detail: null };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        label: REQUEST_STATE_NAMES.failed,
        detail:
          (request.problem === null ? null : sayAgain(request.problem)) ?? say('common.itFailed'),
        help: docsFor(request.problemCode),
      };
  }
};

export { describeRequestBadge };
