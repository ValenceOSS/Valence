import { upsert } from '@ValenceDatabase/upsert';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { continueWatchingDismissal, watchProgress } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { WatchProgressService } from './WatchProgressService';

/**
 * Where each profile has got to in each item, and what they took off continue watching since, held
 * in the database.
 *
 * @param db - The database to read and write.
 * @returns The watch progress service.
 */
const createDatabaseWatchProgressService = (db: AnyValenceDatabase): WatchProgressService => ({
  read: async (profileId, mediaId) => {
    const [row] = await db
      .select()
      .from(watchProgress)
      .where(and(eq(watchProgress.profileId, profileId), eq(watchProgress.mediaItemId, mediaId)))
      .limit(1);

    return row === undefined
      ? null
      : {
          mediaId: row.mediaItemId,
          positionSeconds: row.positionSeconds,
          durationSeconds: row.durationSeconds,
          isFinished: row.isFinished,
          updatedAt: row.updatedAt.toISOString(),
        };
  },

  list: async (profileId) => {
    const rows = await db
      .select({ progress: watchProgress, dismissedAt: continueWatchingDismissal.dismissedAt })
      .from(watchProgress)
      .leftJoin(
        continueWatchingDismissal,
        and(
          eq(continueWatchingDismissal.profileId, watchProgress.profileId),
          eq(continueWatchingDismissal.mediaItemId, watchProgress.mediaItemId),
        ),
      )
      .where(eq(watchProgress.profileId, profileId))
      .orderBy(desc(watchProgress.updatedAt));

    return rows.map(({ progress, dismissedAt }) => ({
      mediaId: progress.mediaItemId,
      positionSeconds: progress.positionSeconds,
      durationSeconds: progress.durationSeconds,
      isFinished: progress.isFinished,
      updatedAt: progress.updatedAt.toISOString(),
      isDismissed: dismissedAt !== null && dismissedAt >= progress.updatedAt,
    }));
  },

  record: async (profileId, report) => {
    await upsert(db, watchProgress, {
      values: [
        {
          id: randomUUID(),
          profileId,
          mediaItemId: report.mediaId,
          positionSeconds: report.positionSeconds,
          durationSeconds: report.durationSeconds,
          isFinished: report.isFinished,
          updatedAt: new Date(),
        },
      ],
      target: [watchProgress.profileId, watchProgress.mediaItemId],
      set: {
        positionSeconds: report.positionSeconds,
        durationSeconds: report.durationSeconds,
        isFinished: report.isFinished,
        updatedAt: new Date(),
      },
    });
  },

  forget: async (profileId, mediaId) => {
    await db
      .delete(watchProgress)
      .where(and(eq(watchProgress.profileId, profileId), eq(watchProgress.mediaItemId, mediaId)));
  },

  dismiss: async (profileId, mediaId) => {
    const dismissedAt = new Date();

    await upsert(db, continueWatchingDismissal, {
      values: [{ profileId, mediaItemId: mediaId, dismissedAt }],
      target: [continueWatchingDismissal.profileId, continueWatchingDismissal.mediaItemId],
      set: { dismissedAt },
    });
  },

  restore: async (profileId, mediaId) => {
    await db
      .delete(continueWatchingDismissal)
      .where(
        and(
          eq(continueWatchingDismissal.profileId, profileId),
          eq(continueWatchingDismissal.mediaItemId, mediaId),
        ),
      );
  },
});

export { createDatabaseWatchProgressService };
