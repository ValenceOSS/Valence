import { eq, inArray } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Succession } from './successorsOf';

/**
 * Gives each item that succeeds another, such as a better copy of the same film, the day the one
 * it replaces was added, where that was earlier, so an upgrade keeps its place in the library
 * rather than showing as newly added.
 *
 * @param db - The database to write.
 * @param successions - Which item each is succeeded by.
 */
const carryOverAddedAt = async (
  db: AnyValenceDatabase,
  successions: readonly Succession[],
): Promise<void> => {
  if (successions.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: mediaItem.id, addedAt: mediaItem.addedAt })
    .from(mediaItem)
    .where(
      inArray(
        mediaItem.id,
        successions.flatMap((one) => [one.from, one.to]),
      ),
    );
  const addedAt = new Map(rows.map((row) => [row.id, row.addedAt]));

  for (const { from, to } of successions) {
    const before = addedAt.get(from);
    const after = addedAt.get(to);

    if (before !== undefined && after !== undefined && before < after) {
      await db.update(mediaItem).set({ addedAt: before }).where(eq(mediaItem.id, to));
    }
  }
};

export { carryOverAddedAt };
