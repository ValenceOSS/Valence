import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { deviceName, session } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { DeviceNotes } from '@ValenceServer/devices/DeviceNotes';

/**
 * What the server knows about the devices an account is signed in on, kept on each sign-in: what
 * the device is, which device it is when its client says, when it was last seen, and what its owner
 * renamed it to. A sign-in renamed before its client said which device it is keeps its name once the
 * client says, rather than leaving it behind under the sign-in.
 *
 * @param db - The database to read and write.
 * @returns The device notes.
 */
const createDatabaseDeviceNotes = (db: AnyValenceDatabase): DeviceNotes => ({
  heldBy: (userId, now) =>
    db
      .select({
        id: session.id,
        deviceId: session.deviceId,
        device: session.device,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(
        and(eq(session.userId, userId), gt(session.expiresAt, now), isNull(session.impersonatedBy)),
      ),

  note: async (sessionId, { deviceId, identity, at }) => {
    await db.transaction(async (tx) => {
      const [held] = await tx
        .select({ userId: session.userId, deviceId: session.deviceId })
        .from(session)
        .where(eq(session.id, sessionId));

      await tx
        .update(session)
        .set({
          device: identity,
          lastActiveAt: at,
          ...(deviceId === null ? {} : { deviceId }),
        })
        .where(eq(session.id, sessionId));

      if (held === undefined || deviceId === null || held.deviceId !== null) {
        return;
      }

      const [already] = await tx
        .select({ name: deviceName.name })
        .from(deviceName)
        .where(and(eq(deviceName.userId, held.userId), eq(deviceName.deviceId, deviceId)));

      if (already === undefined) {
        await tx
          .update(deviceName)
          .set({ deviceId })
          .where(and(eq(deviceName.userId, held.userId), eq(deviceName.deviceId, sessionId)));
      } else {
        await tx
          .delete(deviceName)
          .where(and(eq(deviceName.userId, held.userId), eq(deviceName.deviceId, sessionId)));
      }
    });
  },

  noteActive: async (sessionId, at) => {
    await db.update(session).set({ lastActiveAt: at }).where(eq(session.id, sessionId));
  },

  renamedBy: async (userId) => {
    const rows = await db
      .select({ deviceId: deviceName.deviceId, name: deviceName.name })
      .from(deviceName)
      .where(eq(deviceName.userId, userId));

    return new Map(rows.map((row) => [row.deviceId, row.name]));
  },

  rename: async (userId, deviceId, name) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(deviceName)
        .where(and(eq(deviceName.userId, userId), eq(deviceName.deviceId, deviceId)));

      if (name !== null) {
        await tx.insert(deviceName).values({ userId, deviceId, name, renamedAt: new Date() });
      }
    });
  },

  end: async (userId, sessionIds) => {
    if (sessionIds.length === 0) {
      return;
    }

    await db
      .delete(session)
      .where(and(eq(session.userId, userId), inArray(session.id, [...sessionIds])));
  },
});

export { createDatabaseDeviceNotes };
