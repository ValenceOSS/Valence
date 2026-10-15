import { eq } from 'drizzle-orm';
import { childAccount } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ChildAccountService } from './ChildAccountService';

/**
 * Which accounts are children, whose they are, and the PIN each signs in with where it has one,
 * kept in the database.
 *
 * @param db - The database to read and write.
 * @returns The service.
 */
const createDatabaseChildAccountService = (db: AnyValenceDatabase): ChildAccountService => ({
  list: async (ownerId) =>
    (
      await db
        .select({ userId: childAccount.userId, pinHash: childAccount.pinHash })
        .from(childAccount)
        .where(eq(childAccount.ownerId, ownerId))
    ).map((row) => ({ userId: row.userId, hasPin: row.pinHash !== null })),

  ownerOf: async (userId) => {
    const [row] = await db
      .select({ ownerId: childAccount.ownerId })
      .from(childAccount)
      .where(eq(childAccount.userId, userId))
      .limit(1);

    return row?.ownerId ?? null;
  },

  adopt: async (ownerId, userId) => {
    await db.insert(childAccount).values({ userId, ownerId, pinHash: null });
  },

  pinHashOf: async (userId) => {
    const [row] = await db
      .select({ pinHash: childAccount.pinHash })
      .from(childAccount)
      .where(eq(childAccount.userId, userId))
      .limit(1);

    return row?.pinHash ?? null;
  },

  setPinHash: async (userId, pinHash) => {
    await db.update(childAccount).set({ pinHash }).where(eq(childAccount.userId, userId));
  },
});

export { createDatabaseChildAccountService };
