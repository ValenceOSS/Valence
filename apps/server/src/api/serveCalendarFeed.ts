import { addDays } from '@ValenceCore/functions/addDays';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import { calendarEvents } from '@ValenceServer/calendar/calendarEvents';
import { createCalendarReader } from '@ValenceServer/calendar/createCalendarReader';
import { feedOriginOf } from '@ValenceServer/calendar/feedOriginOf';
import { writeICalendar } from '@ValenceServer/calendar/writeICalendar';
import {
  calendarFeedRoute,
  ensureCalendarFeedRoute,
  readCalendarFeedRoute,
  renewCalendarFeedRoute,
  stopCalendarFeedRoute,
} from '@ValenceServer/routes/CalendarFeedRoute';
import { refuse } from '@ValenceI18n/refuse';
import { say } from '@ValenceI18n/say';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { CalendarFeedOwner } from '@ValenceServer/calendarFeed/CalendarFeedOwner';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const DAYS_BEHIND = 30;

const DAYS_AHEAD = 89;

const FEED_CACHING = 'private, max-age=900';

/**
 * Serves the release calendar as a feed a calendar app subscribes to: the link to it, which each
 * person is handed whenever they ask to add the calendar, and replaces or turns off for themselves,
 * and the feed itself, read by that link with no sign-in, the link's token being the only
 * credential.
 *
 * A banned account's link serves nothing, though banning one also deletes its links, so a link
 * cannot outlast the account's sessions and keys.
 *
 * The feed is worked out for the person the link belongs to, exactly as the calendar in the app is
 * — their face's age ceiling and hidden titles, the libraries they may see, and their own requests —
 * from a month back to three months on.
 *
 * @param app - The application to add the routes to.
 * @param context - What the routes read from.
 */
const serveCalendarFeed = (app: OpenAPIHono, context: AppContext): void => {
  const { viewerOf, calendarFeeds, permissions, askerFor, listUsers, isAccountBanned } = context;
  const read = createCalendarReader(context);

  /**
   * Whose link a request is about: the person signed in, as the face they are watching as.
   *
   * @param headers - The request's headers.
   * @returns Them, or null where nobody is signed in.
   */
  const ownerOf = async (headers: Headers): Promise<CalendarFeedOwner | null> => {
    const viewer = await viewerOf(headers);

    return viewer?.kind === 'account'
      ? { accountId: viewer.accountId, profileId: viewer.profileId }
      : null;
  };

  app.openapi(calendarFeedRoute, async (context) => {
    const owner = await ownerOf(context.req.raw.headers);

    if (owner === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json({ feed: await calendarFeeds.read(owner) }, 200);
  });

  app.openapi(ensureCalendarFeedRoute, async (context) => {
    const owner = await ownerOf(context.req.raw.headers);

    if (owner === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(await calendarFeeds.ensure(owner), 200);
  });

  app.openapi(renewCalendarFeedRoute, async (context) => {
    const owner = await ownerOf(context.req.raw.headers);

    if (owner === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(await calendarFeeds.renew(owner), 201);
  });

  app.openapi(stopCalendarFeedRoute, async (context) => {
    const owner = await ownerOf(context.req.raw.headers);

    if (owner === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await calendarFeeds.stop(owner);

    return context.body(null, 204);
  });

  app.openapi(readCalendarFeedRoute, async (context) => {
    const { file } = context.req.valid('param');
    const owner = await calendarFeeds.resolve(file.slice(0, -'.ics'.length));

    if (owner === null || ((await isAccountBanned?.(owner.accountId)) ?? false)) {
      return context.json(refuse('error.common.thisLinkDoesNotWork'), 404);
    }

    const held = await permissions.resolve(owner.accountId);
    const viewer: Viewer = {
      kind: 'account',
      accountId: owner.accountId,
      profileId: owner.profileId,
      isAdministrator: held.has(ADMINISTRATOR),
    };
    const name = (await listUsers?.())?.find((user) => user.id === owner.accountId)?.name ?? '';
    const today = new Date().toISOString().slice(0, 10);
    const entries = await read({
      viewer,
      asker: askerFor({ id: owner.accountId, name }),
      from: addDays(today, -DAYS_BEHIND),
      to: addDays(today, DAYS_AHEAD),
      who: 'mine',
      today,
    });

    return context.body(
      writeICalendar(
        calendarEvents(entries, feedOriginOf(context.req.url, context.req.raw.headers)),
        {
          name: say('server.api.serveCalendarFeed.valenceCalendar'),
          stamp: new Date(),
        },
      ),
      200,
      { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': FEED_CACHING },
    );
  });
};

export { serveCalendarFeed };
