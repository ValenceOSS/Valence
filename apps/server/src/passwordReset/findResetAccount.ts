import { eq, or } from 'drizzle-orm';
import { user } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ResetAccount } from './createPasswordResetRequests';

/**
 * Finds the account somebody means when they ask for a password reset, by its username or its
 * address, either way ignoring case.
 *
 * @param db - The database.
 * @param identifier - What they typed.
 * @returns The account's id and address, or `null` when none answers to it.
 */
const findResetAccount = async (
  db: AnyValenceDatabase,
  identifier: string,
): Promise<ResetAccount | null> => {
  const named = identifier.trim().toLowerCase();

  if (named === '') {
    return null;
  }

  const rows = await db
    .select({ userId: user.id, email: user.email })
    .from(user)
    .where(or(eq(user.username, named), eq(user.email, named)))
    .limit(1);

  return rows[0] ?? null;
};

export { findResetAccount };
