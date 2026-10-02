import { calendarEntriesOfLibrary } from '@ValenceServer/calendar/calendarEntriesOfLibrary';
import { calendarEntriesOfRequests } from '@ValenceServer/calendar/calendarEntriesOfRequests';
import { mergeCalendar } from '@ValenceServer/calendar/mergeCalendar';
import { releaseCalendarRoute } from '@ValenceServer/routes/CalendarRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { AppContext } from '@ValenceServer/api/AppContext';
import { cataloguePicturePath } from '@ValenceServer/images/cataloguePicturePath';
import type { CalendarAudience, CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Points an entry's pictures from the catalogue at this server, which keeps them, so a client never
 * draws from the catalogue and a title filed in later finds its pictures already fetched.
 *
 * @param entry - The entry.
 * @returns The entry with its pictures on this server.
 */
const drawnFromThisServer = (entry: CalendarEntry): CalendarEntry => ({
  ...entry,
  posterUrl: cataloguePicturePath(entry.posterUrl),
  backdropUrl: cataloguePicturePath(entry.backdropUrl),
  logoUrl: cataloguePicturePath(entry.logoUrl),
  episode:
    entry.episode === null
      ? null
      : { ...entry.episode, stillUrl: cataloguePicturePath(entry.episode.stillUrl) },
});

/**
 * Serves the release calendar: episodes of the shows a viewer can watch, and the films and episodes
 * they, or anybody where they may see everybody's, have asked for — something asked for drawn with
 * the catalogue's backdrop, logo and episode stills, as the library draws what it holds, every
 * picture served by this server.
 *
 * @param app - The application to add the route to.
 * @param context - What the route reads from.
 */
const serveCalendar = (app: OpenAPIHono, context: AppContext): void => {
  const { library, viewerOf, requires, throughRequests, ASKERS, SEES_EVERY_REQUEST } = context;

  /**
   * The requests for films and series a viewer may see on the calendar.
   *
   * A request is shown only where the library it files into is one the viewer can see, and once it
   * has arrived only where the title itself is within their reach, so the calendar says no more
   * than the library would. Where requesting is off, or the viewer may not ask, there are none.
   *
   * @param headers - The request, for who is asking.
   * @param viewer - Who is asking.
   * @param who - Whether they asked for their own requests or everybody's.
   * @returns The requests to show.
   */
  const requestsShownTo = async (
    headers: Headers,
    viewer: Extract<Viewer, { kind: 'account' }>,
    who: CalendarAudience,
  ): Promise<MediaRequest[]> => {
    const answer = await throughRequests(headers, (client) => client.listRequests(), [
      ...ASKERS,
      ...SEES_EVERY_REQUEST,
    ]);

    if (answer.kind !== 'answered') {
      return [];
    }

    const seesAll =
      who === 'everyone' &&
      (
        await Promise.all(
          SEES_EVERY_REQUEST.map(async (permission) => requires(headers, permission)),
        )
      ).some(Boolean);

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

  app.openapi(releaseCalendarRoute, async (context) => {
    const { headers } = context.req.raw;
    const viewer = await viewerOf(headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { from, to, who, today: theirToday } = context.req.valid('query');
    const today = theirToday ?? new Date().toISOString().slice(0, 10);

    const [episodes, requests] = await Promise.all([
      library.releaseCalendar(viewer, from, to),
      viewer.kind === 'account' ? requestsShownTo(headers, viewer, who) : Promise.resolve([]),
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

    return context.json(
      {
        entries: mergeCalendar(
          calendarEntriesOfLibrary(episodes, today),
          calendarEntriesOfRequests(requests, from, to, stills, artwork),
        ).map(drawnFromThisServer),
      },
      200,
    );
  });
};

export { serveCalendar };
