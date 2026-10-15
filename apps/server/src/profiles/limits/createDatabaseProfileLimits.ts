import { and, eq } from 'drizzle-orm';
import { profileAgeCeiling, profileLibraryBlock } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ProfileLimits } from './ProfileLimits';

/**
 * What an account's owner has narrowed each profile to, kept in the database: the libraries a
 * profile may not reach, and the age each library is capped at for it.
 *
 * @param db - The database to read and write.
 * @returns The limits.
 */
const createDatabaseProfileLimits = (db: AnyValenceDatabase): ProfileLimits => ({
  refusedLibraries: async (profileId) =>
    (
      await db
        .select({ libraryId: profileLibraryBlock.libraryId })
        .from(profileLibraryBlock)
        .where(eq(profileLibraryBlock.profileId, profileId))
    ).map((row) => row.libraryId),

  ceilingsFor: (profileId) =>
    db
      .select({
        libraryId: profileAgeCeiling.libraryId,
        maximumAge: profileAgeCeiling.maximumAge,
        allowsUnrated: profileAgeCeiling.allowsUnrated,
      })
      .from(profileAgeCeiling)
      .where(eq(profileAgeCeiling.profileId, profileId)),

  refuseLibrary: async (profileId, libraryId) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(profileLibraryBlock)
        .where(
          and(
            eq(profileLibraryBlock.profileId, profileId),
            eq(profileLibraryBlock.libraryId, libraryId),
          ),
        );
      await tx.insert(profileLibraryBlock).values({ profileId, libraryId, blockedAt: new Date() });
    });
  },

  allowLibrary: async (profileId, libraryId) => {
    await db
      .delete(profileLibraryBlock)
      .where(
        and(
          eq(profileLibraryBlock.profileId, profileId),
          eq(profileLibraryBlock.libraryId, libraryId),
        ),
      );
  },

  setCeiling: async (profileId, ceiling) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(profileAgeCeiling)
        .where(
          and(
            eq(profileAgeCeiling.profileId, profileId),
            eq(profileAgeCeiling.libraryId, ceiling.libraryId),
          ),
        );
      await tx.insert(profileAgeCeiling).values({ profileId, ...ceiling, setAt: new Date() });
    });
  },

  clearCeiling: async (profileId, libraryId) => {
    await db
      .delete(profileAgeCeiling)
      .where(
        and(eq(profileAgeCeiling.profileId, profileId), eq(profileAgeCeiling.libraryId, libraryId)),
      );
  },
});

export { createDatabaseProfileLimits };
