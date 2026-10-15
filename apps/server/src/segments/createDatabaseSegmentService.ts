import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { MediaSegmentSchema } from '@ValenceContracts/schemas/MediaSegment';
import { VideoChapterListSchema } from '@ValenceContracts/schemas/VideoChapter';
import { mediaItem, mediaSegment } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SegmentService } from './SegmentService';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

/**
 * The marked stretches of each item — intros, outros, recaps — held in Postgres, so detection runs
 * once and every playback afterwards simply reads them, and the chapters the scan read from each
 * file, which mark the same timeline.
 *
 * @param db - The database to read and write.
 * @returns The segment service.
 */
const createDatabaseSegmentService = (db: AnyValenceDatabase): SegmentService => ({
  list: async (mediaId) => {
    const rows = await db.select().from(mediaSegment).where(eq(mediaSegment.mediaItemId, mediaId));

    return rows
      .map((row) =>
        MediaSegmentSchema.safeParse({
          kind: row.kind,
          startSeconds: row.startSeconds,
          endSeconds: row.endSeconds,
          source: row.source,
        }),
      )
      .filter((parsed) => parsed.success)
      .map((parsed) => parsed.data);
  },

  replace: async (mediaId, segments) => {
    await db.transaction(async (transaction) => {
      await transaction.delete(mediaSegment).where(eq(mediaSegment.mediaItemId, mediaId));

      if (segments.length === 0) {
        return;
      }

      await transaction.insert(mediaSegment).values(
        segments.map((segment) => ({
          id: randomUUID(),
          mediaItemId: mediaId,
          kind: segment.kind,
          startSeconds: segment.startSeconds,
          endSeconds: segment.endSeconds,
          source: segment.source,
        })),
      );
    });
  },

  chapters: async (mediaId) => {
    const [row] = await db
      .select({ chapters: mediaItem.chapters })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId));

    return VideoChapterListSchema.catch([]).parse(row?.chapters ?? []);
  },
});

export type { MediaSegment };

export { createDatabaseSegmentService };
