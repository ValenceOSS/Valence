import { eq } from 'drizzle-orm';
import { apiKeyProfile, sessionProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ChosenProfiles } from './ChosenProfiles';

/**
 * Which profile each signed-in session and each API key acts as, kept in the database beside the
 * sessions and keys themselves so that ending either forgets the choice with it.
 *
 * @param db - The database to read and write.
 * @returns The chosen profiles.
 */
const createDatabaseChosenProfiles = (db: AnyValenceDatabase): ChosenProfiles => ({
  chosenFor: async (sessionId) => {
    const [row] = await db
      .select({ profileId: sessionProfile.profileId })
      .from(sessionProfile)
      .where(eq(sessionProfile.sessionId, sessionId))
      .limit(1);

    return row?.profileId ?? null;
  },

  choose: async (sessionId, profileId) => {
    await db.transaction(async (tx) => {
      await tx.delete(sessionProfile).where(eq(sessionProfile.sessionId, sessionId));
      await tx.insert(sessionProfile).values({ sessionId, profileId, chosenAt: new Date() });
    });
  },

  forget: async (sessionId) => {
    await db.delete(sessionProfile).where(eq(sessionProfile.sessionId, sessionId));
  },

  keyProfileOf: async (keyId) => {
    const [row] = await db
      .select({ profileId: apiKeyProfile.profileId })
      .from(apiKeyProfile)
      .where(eq(apiKeyProfile.keyId, keyId))
      .limit(1);

    return row?.profileId ?? null;
  },

  tieKey: async (keyId, profileId) => {
    await db.transaction(async (tx) => {
      await tx.delete(apiKeyProfile).where(eq(apiKeyProfile.keyId, keyId));
      await tx.insert(apiKeyProfile).values({ keyId, profileId });
    });
  },
});

export { createDatabaseChosenProfiles };
