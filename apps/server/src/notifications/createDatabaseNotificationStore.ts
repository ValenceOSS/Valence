import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, isNull, lt } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import {
  DEFAULT_NOTIFICATION_PREFERENCE,
  NotificationEventSchema,
} from '@ValenceContracts/schemas/Notification';
import { notification, notificationPreference, pushSubscription, user } from '#dialect/Schema';
import { toIso } from '@ValenceCore/functions/toIso';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Notification } from '@ValenceContracts/schemas/Notification';
import { keptSince } from './keptSince';
import type { NotificationStore } from './NotificationStore';

/**
 * Notifications and their read state, held in the database, along with the preferences saying which
 * kinds each account wants and where.
 *
 * @param db - The database to read and write.
 * @returns The notification store.
 */
const createDatabaseNotificationStore = (db: AnyValenceDatabase): NotificationStore => {
  const readRow = (row: typeof notification.$inferSelect): Notification[] => {
    const event = NotificationEventSchema.safeParse(row.event);

    return event.success
      ? [
          {
            id: row.id,
            event: event.data,
            title: row.title,
            body: row.body,
            link: row.link,
            createdAt: row.createdAt.toISOString(),
            readAt: toIso(row.readAt),
          },
        ]
      : [];
  };

  const forgetTheOldest = async (userId: string): Promise<void> => {
    await db
      .delete(notification)
      .where(
        and(eq(notification.userId, userId), lt(notification.createdAt, keptSince(new Date()))),
      );
  };

  return {
    listWanting: async (event, transport) => {
      const rows = await db
        .select({
          userId: user.id,
          inApp: notificationPreference.inApp,
          push: notificationPreference.push,
        })
        .from(user)
        .leftJoin(
          notificationPreference,
          and(eq(notificationPreference.userId, user.id), eq(notificationPreference.event, event)),
        );

      return rows
        .filter((row) => {
          const chosen = transport === 'inApp' ? row.inApp : row.push;

          return chosen ?? DEFAULT_NOTIFICATION_PREFERENCE[transport];
        })
        .map((row) => row.userId);
    },

    notify: async (userIds, { event, title, body, link }) => {
      if (userIds.length === 0) {
        return [];
      }

      const createdAt = new Date();
      const rows = userIds.map((userId) => ({
        id: randomUUID(),
        userId,
        event,
        title,
        body,
        link,
        createdAt,
      }));

      await db.insert(notification).values(rows);

      return rows.map((row) => ({
        id: row.id,
        event,
        title,
        body,
        link,
        createdAt: createdAt.toISOString(),
        readAt: null,
      }));
    },

    list: async (userId, limit) => {
      await forgetTheOldest(userId);

      const rows = await db
        .select()
        .from(notification)
        .where(eq(notification.userId, userId))
        .orderBy(desc(notification.createdAt), desc(notification.id))
        .limit(limit);

      return rows.flatMap((row) => readRow(row));
    },

    countUnread: async (userId) => {
      await forgetTheOldest(userId);

      const rows = await db
        .select({ total: count() })
        .from(notification)
        .where(and(eq(notification.userId, userId), isNull(notification.readAt)));

      return rows[0]?.total ?? 0;
    },

    clear: async (userId, notificationId) => {
      await db
        .delete(notification)
        .where(
          and(
            eq(notification.userId, userId),
            ...(notificationId === undefined ? [] : [eq(notification.id, notificationId)]),
          ),
        );
    },

    markRead: async (userId, notificationId) => {
      await db
        .update(notification)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notification.userId, userId),
            isNull(notification.readAt),
            ...(notificationId === undefined ? [] : [eq(notification.id, notificationId)]),
          ),
        );
    },

    readPreferences: async (userId) => {
      const rows = await db
        .select()
        .from(notificationPreference)
        .where(eq(notificationPreference.userId, userId));

      return rows.flatMap((row) => {
        const event = NotificationEventSchema.safeParse(row.event);

        return event.success ? [{ event: event.data, inApp: row.inApp, push: row.push }] : [];
      });
    },

    writePreference: async (userId, { event, inApp, push }) => {
      await upsert(db, notificationPreference, {
        values: [{ userId, event, inApp, push }],
        target: [notificationPreference.userId, notificationPreference.event],
        set: { inApp, push },
      });
    },

    addPushEndpoint: async (userId, { endpoint, p256dh, auth }) => {
      await upsert(db, pushSubscription, {
        values: [{ id: randomUUID(), userId, endpoint, p256dh, auth }],
        target: pushSubscription.endpoint,
        set: { userId, p256dh, auth },
      });
    },

    listPushEndpoints: async (userId) => {
      const rows = await db
        .select({
          endpoint: pushSubscription.endpoint,
          p256dh: pushSubscription.p256dh,
          auth: pushSubscription.auth,
        })
        .from(pushSubscription)
        .where(eq(pushSubscription.userId, userId));

      return rows;
    },

    removePushEndpoint: async (userId, endpoint) => {
      await db
        .delete(pushSubscription)
        .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)));
    },
  };
};

export { createDatabaseNotificationStore };
