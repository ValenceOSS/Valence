import { and, asc, eq, inArray } from 'drizzle-orm';
import { mediaPart } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaPart } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * How the parts of a film kept as several files are found from the path of its first part, which
 * is the path the film itself is stored and asked for at.
 *
 * @param db - The database.
 * @returns The parts of the film a path is the first part of, in order, or null where it is not
 *   the first part of one.
 */
const createPartsOf =
  (db: AnyValenceDatabase) =>
  async (path: string): Promise<readonly MediaPart[] | null> => {
    const rows = await db
      .select({ path: mediaPart.path, durationSeconds: mediaPart.durationSeconds })
      .from(mediaPart)
      .where(
        inArray(
          mediaPart.mediaItemId,
          db
            .select({ id: mediaPart.mediaItemId })
            .from(mediaPart)
            .where(and(eq(mediaPart.path, path), eq(mediaPart.position, 1))),
        ),
      )
      .orderBy(asc(mediaPart.mediaItemId), asc(mediaPart.position));

    return rows.length > 1 ? rows : null;
  };

export { createPartsOf };
