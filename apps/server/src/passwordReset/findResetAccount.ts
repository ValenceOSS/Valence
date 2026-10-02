import { eq, or } from 'drizzle-orm';
import type { PasswordResetAsk } from '@ValenceContracts/schemas/PasswordResetRequest';
import { user, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ResetAccount } from './createPasswordResetRequests';

/**
 * Finds the account somebody means when they ask for a password reset: by its username or its
 * address, either way ignoring case, or by the face they picked, whose account it is.
 *
 * @param db - The database.
 * @param ask - What they typed, or which face they picked.
 * @returns The account's id and address, or `null` when none answers to it.
 */
const findResetAccount = async (
  db: AnyValenceDatabase,
  ask: PasswordResetAsk,
): Promise<ResetAccount | null> => {
  if ('profileId' in ask) {
    const rows = await db
      .select({ userId: user.id, email: user.email })
      .from(viewerProfile)
      .innerJoin(user, eq(user.id, viewerProfile.userId))
      .where(eq(viewerProfile.id, ask.profileId))
      .limit(1);

    return rows[0] ?? null;
  }

  const named = ask.identifier.trim().toLowerCase();

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
