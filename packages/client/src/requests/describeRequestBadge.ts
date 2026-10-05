import { sayAgain } from '@ValenceI18n/sayAgain';
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
    .sort()[0] ?? null;

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
      label: say('client.requests.describeRequestBadge.waitingToBeAdded'),
      detail: say('client.requests.describeRequestBadge.booksAreAddedToTheLibrary'),
    };
  }

  switch (request.state) {
    case 'awaitingApproval':
      return {
        ...STATUS_LOOK.attention,
        label: say('client.requests.describeRequestBadge.awaitingApproval'),
        detail: null,
      };
    case 'refused':
      return {
        ...STATUS_LOOK.failed,
        label: say('common.refused'),
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

      const isOutNow =
        request.kind === 'film'
          ? request.releaseDate === null || request.releaseDate <= today
          : request.items.some((item) => item.state === 'waiting' && isOut(item, today));

      if (isOutNow) {
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
        label: say('common.wanted'),
        detail:
          (request.problem === null ? null : sayAgain(request.problem)) ??
          (request.isPickedByHand
            ? say('client.requests.describeRequestBadge.waitingForAReleaseToBe')
            : say('client.requests.describeRequestBadge.searchedForAgainEveryFewHours')),
        help: docsFor(request.problemCode),
      };
    case 'searching':
      return { ...STATUS_LOOK.working, label: say('common.searching'), detail: null };
    case 'chosen':
      return { ...STATUS_LOOK.working, label: say('common.releaseChosen'), detail: null };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: say('common.downloading'),
        detail: request.items.find((item) => item.state === 'downloading')?.releaseTitle ?? null,
      };
    case 'filing':
      return {
        ...STATUS_LOOK.working,
        label: say('common.filing'),
        detail: request.problem === null ? null : sayAgain(request.problem),
        help: docsFor(request.problemCode),
      };
    case 'filed':
      return {
        ...STATUS_LOOK.working,
        label: say('common.filed'),
        detail: say('client.requests.describeRequestBadge.inItsLibraryWaitingForThe'),
      };
    case 'available':
      return { ...STATUS_LOOK.done, detail: null };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        detail:
          (request.problem === null ? null : sayAgain(request.problem)) ?? say('common.itFailed'),
        help: docsFor(request.problemCode),
      };
  }
};

export { describeRequestBadge };
