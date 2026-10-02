import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { watchProgress } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type ImportedProgress = {
  profileId: string;
  mediaItemId: string;
  positionSeconds: number;
  durationSeconds: number;
  isFinished: boolean;
  at: Date;
};

/**
 * Writes where somebody had got to in an item on the old server, dated when they got there rather
 * than now, and leaves alone anything they have watched in Valence since.
 *
 * @param db - The database.
 * @param progress - Who, what, how far and when.
 * @returns Whether it was written.
 */
const writeImportedProgress = async (
  db: AnyValenceDatabase,
  progress: ImportedProgress,
): Promise<boolean> => {
  const [held] = await db
    .select({ updatedAt: watchProgress.updatedAt })
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.profileId, progress.profileId),
        eq(watchProgress.mediaItemId, progress.mediaItemId),
      ),
    )
    .limit(1);

  if (held !== undefined && held.updatedAt.getTime() >= progress.at.getTime()) {
    return false;
  }

  const values = {
    positionSeconds: progress.positionSeconds,
    durationSeconds: progress.durationSeconds,
    isFinished: progress.isFinished,
    updatedAt: progress.at,
  };

  await upsert(db, watchProgress, {
    values: [
      {
        id: randomUUID(),
        profileId: progress.profileId,
        mediaItemId: progress.mediaItemId,
        ...values,
      },
    ],
    target: [watchProgress.profileId, watchProgress.mediaItemId],
    set: values,
  });

  return true;
};

export type { ImportedProgress };

export { writeImportedProgress };
