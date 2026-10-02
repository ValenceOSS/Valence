import { calendarEntriesOfLibrary } from '@ValenceServer/calendar/calendarEntriesOfLibrary';
import { calendarEntriesOfRequests } from '@ValenceServer/calendar/calendarEntriesOfRequests';
import { drawnFromThisServer } from '@ValenceServer/calendar/drawnFromThisServer';
import { mergeCalendar } from '@ValenceServer/calendar/mergeCalendar';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { Asker } from '@ValenceServer/api/Asker';
import type { CalendarAudience, CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type CalendarReads = Pick<
  AppContext,
  'library' | 'throughRequests' | 'ASKERS' | 'SEES_EVERY_REQUEST'
>;

/**
 * Builds what reads the release calendar for somebody: episodes of the shows they can watch, and
 * the films and episodes they, or anybody where they may see everybody's, have asked for — whether
 * they are asking in the app or their calendar app is asking by its link, so the two always agree.
 *
 * @param reads - The library and the requests service to read from.
 * @returns What reads it.
 */
const createCalendarReader = ({
  library,
  throughRequests,
  ASKERS,
  SEES_EVERY_REQUEST,
}: CalendarReads) => {
  /**
   * The requests for films and series somebody may see on the calendar.
   *
   * A request is shown only where the library it files into is one they can see, and once it has
   * arrived only where the title itself is within their reach, so the calendar says no more than
   * the library would. Where requesting is off, or they may not ask, there are none.
   *
   * @param asker - Who is asking, with what they may do.
   * @param viewer - Who is looking.
   * @param who - Whether their own requests or everybody's are wanted.
   * @returns The requests to show.
   */
  const requestsShownTo = async (
    asker: Asker,
    viewer: Extract<Viewer, { kind: 'account' }>,
    who: CalendarAudience,
  ): Promise<MediaRequest[]> => {
    const answer = await throughRequests(asker, (client) => client.listRequests(), [
      ...ASKERS,
      ...SEES_EVERY_REQUEST,
    ]);

    if (answer.kind !== 'answered') {
      return [];
    }

    const seesAll =
      who === 'everyone' &&
      (await Promise.all(SEES_EVERY_REQUEST.map(async (held) => asker.holds(held)))).some(Boolean);

    const libraries = new Set((await library.list(viewer)).map((entry) => entry.id));

    const shown = answer.value.filter(
      (request) =>
        (request.kind === 'film' || request.kind === 'series') &&
        libraries.has(request.libraryId) &&
        (seesAll || request.requestedBy.id === viewer.accountId),
    );

    const reachable = await Promise.all(
      shown.map(async (request) => {
        if (request.mediaId === null || viewer.isAdministrator) {
          return true;
        }

        return request.kind === 'film'
          ? !(await library.isOutOfReach(viewer.accountId, request.mediaId))
          : !(await library.isSeriesOutOfReach(viewer.accountId, request.mediaId));
      }),
    );

    return shown.filter((_, index) => reachable[index] === true);
  };

  return async (asked: {
    viewer: Viewer;
    asker: Asker;
    from: string;
    to: string;
    who: CalendarAudience;
    today: string;
  }): Promise<CalendarEntry[]> => {
    const { viewer, asker, from, to, who, today } = asked;

    const [episodes, requests] = await Promise.all([
      library.releaseCalendar(viewer, from, to),
      viewer.kind === 'account' ? requestsShownTo(asker, viewer, who) : Promise.resolve([]),
    ]);

    const [stills, artwork] = await Promise.all([
      library.airingStills(
        requests.flatMap((request) =>
          request.kind === 'series' && request.tmdbId !== null ? [request.tmdbId.toString()] : [],
        ),
      ),
      library.catalogueArtwork(
        requests.flatMap((request) =>
          request.tmdbId === null || (request.kind === 'film' && request.mediaId !== null)
            ? []
            : [
                {
                  kind: request.kind === 'film' ? ('movie' as const) : ('tv' as const),
                  externalId: request.tmdbId.toString(),
                },
              ],
        ),
      ),
    ]);

    return mergeCalendar(
      calendarEntriesOfLibrary(episodes, today),
      calendarEntriesOfRequests(requests, from, to, stills, artwork),
    ).map(drawnFromThisServer);
  };
};

export { createCalendarReader };
