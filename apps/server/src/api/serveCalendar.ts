import { createCalendarReader } from '@ValenceServer/calendar/createCalendarReader';
import { releaseCalendarRoute } from '@ValenceServer/routes/CalendarRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Serves the release calendar to somebody signed in: episodes of the shows they can watch, and the
 * films and episodes they, or anybody where they may see everybody's, have asked for — something
 * asked for drawn with the catalogue's backdrop, logo and episode stills, as the library draws what
 * it holds, every picture served by this server. Whether an episode has aired yet is judged by the
 * viewer's own day where they say what it is, and by the server's otherwise.
 *
 * @param app - The application to add the route to.
 * @param context - What the route reads from.
 */
const serveCalendar = (app: OpenAPIHono, context: AppContext): void => {
  const { viewerOf, askerOf } = context;
  const read = createCalendarReader(context);

  app.openapi(releaseCalendarRoute, async (context) => {
    const { headers } = context.req.raw;
    const viewer = await viewerOf(headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { from, to, who, today } = context.req.valid('query');

    return context.json(
      {
        entries: await read({
          viewer,
          asker: askerOf(headers),
          from,
          to,
          who,
          today: today ?? new Date().toISOString().slice(0, 10),
        }),
      },
      200,
    );
  });
};

export { serveCalendar };
