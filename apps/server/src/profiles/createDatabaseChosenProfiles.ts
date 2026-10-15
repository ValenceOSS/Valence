import { eq } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
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
    const chosenAt = new Date();

    await upsert(db, sessionProfile, {
      values: [{ sessionId, profileId, chosenAt }],
      target: sessionProfile.sessionId,
      set: { profileId, chosenAt },
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
    await upsert(db, apiKeyProfile, {
      values: [{ keyId, profileId }],
      target: apiKeyProfile.keyId,
      set: { profileId },
    });
  },
});

export { createDatabaseChosenProfiles };
