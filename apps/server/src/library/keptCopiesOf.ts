import { eq } from 'drizzle-orm';
import { mediaItem, mediaRendition } from '#dialect/Schema';
import type { SQL } from 'drizzle-orm';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * The files of every copy kept alongside the items that match, read before those items go, since
 * their rows go with them.
 *
 * @param db - The database to read.
 * @param which - The items.
 * @returns Where each copy is.
 */
const keptCopiesOf = async (db: AnyValenceDatabase, which: SQL | undefined): Promise<string[]> => {
  const rows = await db
    .select({ path: mediaRendition.path })
    .from(mediaRendition)
    .innerJoin(mediaItem, eq(mediaItem.id, mediaRendition.mediaItemId))
    .where(which);

  return rows.map((row) => row.path);
};

export { keptCopiesOf };
