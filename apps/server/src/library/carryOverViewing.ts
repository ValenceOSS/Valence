import { and, eq, notInArray } from 'drizzle-orm';
import { favourite, hidden, rating, watchHistory, watchProgress } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Succession } from './successorsOf';

/**
 * Moves what each viewer has of an item onto the item that succeeds it — how far they got, what
 * they watched and when, and whether they kept, rated or hid it — before the item goes and takes it
 * all with it. Where a viewer already has their own on the successor, theirs there stands.
 *
 * @param db - The database to write.
 * @param successions - Which item each is succeeded by.
 */
const carryOverViewing = async (
  db: AnyValenceDatabase,
  successions: readonly Succession[],
): Promise<void> => {
  for (const { from, to } of successions) {
    await db
      .update(watchHistory)
      .set({ mediaItemId: to })
      .where(eq(watchHistory.mediaItemId, from));

    for (const table of [watchProgress, favourite, rating, hidden]) {
      const already = await db
        .select({ profileId: table.profileId })
        .from(table)
        .where(eq(table.mediaItemId, to));
      const theirs = already.map((one) => one.profileId);

      await db
        .update(table)
        .set({ mediaItemId: to })
        .where(
          theirs.length === 0
            ? eq(table.mediaItemId, from)
            : and(eq(table.mediaItemId, from), notInArray(table.profileId, theirs)),
        );
    }
  }
};

export { carryOverViewing };
