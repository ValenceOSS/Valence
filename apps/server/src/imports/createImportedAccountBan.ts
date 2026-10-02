import { eq } from 'drizzle-orm';
import { user } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Builds what bans an account the import has just made for somebody who was disabled on the old
 * server; a new account has no sessions or keys yet, so the flag and its reason are all there is.
 *
 * @param db - The database.
 * @returns What bans an account, answering whether it was there.
 */
const createImportedAccountBan =
  (db: AnyValenceDatabase) =>
  async (userId: string, reason: string): Promise<boolean> => {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

    if (found === undefined) {
      return false;
    }

    await db.update(user).set({ banned: true, banReason: reason }).where(eq(user.id, userId));

    return true;
  };

export { createImportedAccountBan };
