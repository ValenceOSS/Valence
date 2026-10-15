import {
  clearNotificationsRoute,
  listNotificationsRoute,
  readNotificationsRoute,
  readNotificationPreferencesRoute,
  writeNotificationPreferenceRoute,
  subscribeToPushRoute,
  unsubscribeFromPushRoute,
  NOTIFICATION_PAGE,
} from '@ValenceServer/routes/NotificationRoute';
import {
  DEFAULT_NOTIFICATION_PREFERENCE,
  NOTIFICATION_EVENTS,
} from '@ValenceContracts/schemas/Notification';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the notification endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveNotification = (app: OpenAPIHono, context: AppContext): void => {
  const { notifications, readPushPublicKey, readAccount, readActing } = context;

  /**
   * Whose notifications a request reads: the account, and the profile acting for it.
   *
   * @param headers - The request's headers.
   * @returns The account and profile, or nothing where nobody is signed in.
   */
  const whoseFor = async (headers: Headers) => {
    const acting = await readActing(headers);

    return acting === null
      ? null
      : { userId: acting.account.id, profileId: acting.profile?.id ?? null };
  };

  app.openapi(listNotificationsRoute, async (context) => {
    const whose = await whoseFor(context.req.raw.headers);

    if (whose === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(
      {
        notifications: await notifications.list(whose, NOTIFICATION_PAGE),
        unread: await notifications.countUnread(whose),
      },
      200,
    );
  });

  app.openapi(readNotificationsRoute, async (context) => {
    const whose = await whoseFor(context.req.raw.headers);

    if (whose === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { id } = context.req.valid('json');

    await notifications.markRead(whose, id);

    return context.json({ unread: await notifications.countUnread(whose) }, 200);
  });

  app.openapi(clearNotificationsRoute, async (context) => {
    const whose = await whoseFor(context.req.raw.headers);

    if (whose === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { id } = context.req.valid('json');

    await notifications.clear(whose, id);

    return context.json({ unread: await notifications.countUnread(whose) }, 200);
  });

  app.openapi(readNotificationPreferencesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const stored = await notifications.readPreferences(account.id);

    const chosen = new Map(stored.map((one) => [one.event, one]));

    const preferences = NOTIFICATION_EVENTS.map(
      (event) => chosen.get(event) ?? { event, ...DEFAULT_NOTIFICATION_PREFERENCE },
    );

    return context.json({ preferences, pushPublicKey: await readPushPublicKey() }, 200);
  });

  app.openapi(writeNotificationPreferenceRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await notifications.writePreference(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(subscribeToPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await notifications.addPushEndpoint(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(unsubscribeFromPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await notifications.removePushEndpoint(account.id, context.req.valid('json').endpoint);

    return context.body(null, 204);
  });
};

export { serveNotification };
