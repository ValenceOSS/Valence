import { and, eq, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { ageCeiling, libraryBlock, profileAgeCeiling, profileLibraryBlock } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whether a ceiling's row refuses a film of this age: one above it, or one with no certificate
 * where unrated films are not allowed.
 *
 * @param maximumAge - The ceiling's age.
 * @param allowsUnrated - Whether it lets through a film with no certificate.
 * @param age - The film's age, where its certificate gives one.
 * @returns The condition.
 */
const refusesAge = (
  maximumAge: typeof ageCeiling.maximumAge | typeof profileAgeCeiling.maximumAge,
  allowsUnrated: typeof ageCeiling.allowsUnrated | typeof profileAgeCeiling.allowsUnrated,
  age: number | null,
): SQL => (age === null ? eq(allowsUnrated, false) : lt(maximumAge, age));

/**
 * Whether somebody may watch a film played from a source, asked before it is played so a viewer
 * it would be refused to changes nothing: the same answer the gate on every streamed film gives
 * once it is kept. Films from sources sit in a library nobody is limited to, so an account or a
 * profile limited to any library reaches none of them, and every age ceiling the account or the
 * profile has, in any library, applies to them, with a film that has no certificate refused where
 * a ceiling refuses unrated films.
 *
 * @param db - The database.
 * @param viewer - Who is asking.
 * @param age - The film's age, read from its certificate, where it has one.
 * @returns Whether they may.
 */
const mayWatchStreamedFilm = async (
  db: AnyValenceDatabase,
  viewer: Viewer,
  age: number | null,
): Promise<boolean> => {
  if (viewer.kind !== 'account') {
    return false;
  }

  const { accountId, profileId, isAdministrator } = viewer;

  if (!isAdministrator) {
    const [blocked] = await db
      .select({ libraryId: libraryBlock.libraryId })
      .from(libraryBlock)
      .where(eq(libraryBlock.userId, accountId))
      .limit(1);
    const [ceiling] = await db
      .select({ libraryId: ageCeiling.libraryId })
      .from(ageCeiling)
      .where(
        and(
          eq(ageCeiling.userId, accountId),
          refusesAge(ageCeiling.maximumAge, ageCeiling.allowsUnrated, age),
        ),
      )
      .limit(1);

    if (blocked !== undefined || ceiling !== undefined) {
      return false;
    }
  }

  if (profileId === null) {
    return true;
  }

  const [blocked] = await db
    .select({ libraryId: profileLibraryBlock.libraryId })
    .from(profileLibraryBlock)
    .where(eq(profileLibraryBlock.profileId, profileId))
    .limit(1);
  const [ceiling] = await db
    .select({ libraryId: profileAgeCeiling.libraryId })
    .from(profileAgeCeiling)
    .where(
      and(
        eq(profileAgeCeiling.profileId, profileId),
        refusesAge(profileAgeCeiling.maximumAge, profileAgeCeiling.allowsUnrated, age),
      ),
    )
    .limit(1);

  return blocked === undefined && ceiling === undefined;
};

export { mayWatchStreamedFilm };
