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

/**
 * Registers the notification endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveNotification = (app: OpenAPIHono, context: AppContext): void => {
  const { notifications, readPushPublicKey, readAccount } = context;

  app.openapi(listNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      {
        notifications: await notifications.list(account.id, NOTIFICATION_PAGE),
        unread: await notifications.countUnread(account.id),
      },
      200,
    );
  });

  app.openapi(readNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { id } = context.req.valid('json');

    await notifications.markRead(account.id, id);

    return context.json({ unread: await notifications.countUnread(account.id) }, 200);
  });

  app.openapi(clearNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { id } = context.req.valid('json');

    await notifications.clear(account.id, id);

    return context.json({ unread: await notifications.countUnread(account.id) }, 200);
  });

  app.openapi(readNotificationPreferencesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
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
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.writePreference(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(subscribeToPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.addPushEndpoint(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(unsubscribeFromPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.removePushEndpoint(account.id, context.req.valid('json').endpoint);

    return context.body(null, 204);
  });
};

export { serveNotification };
