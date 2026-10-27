import { and, eq, notExists, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { libraryBlock, mediaItem, profileLibraryBlock } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isStreamedItem } from '@ValenceServer/visibility/isStreamedItem';
import { withinTheCeiling } from '@ValenceServer/visibility/withinTheCeiling';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whether an item is in a library this account and this profile are allowed to reach at all.
 *
 * This is the enforcement half, and the half a viewer cannot lift. It comes in two layers: what an
 * administrator allowed the account, and what the account's owner narrowed a profile to within
 * that. A profile is chosen with the account's session and, where it has one, its PIN, so a limit
 * on a child's profile holds for whoever picks it. An owner can only narrow: a profile never
 * reaches what its account cannot.
 *
 * Access is stored as refusals rather than grants, which is what makes the default right: every
 * account and profile reaches every library until somebody says otherwise, and a household of
 * adults configures nothing. A film played from a source sits in a library nobody is ever limited
 * to, so somebody limited to any library at all reaches none of them.
 *
 * Carries the age ceilings too, since they decide the same question: whether this item may be
 * reached at all. Keeping them together is what makes the gate on a direct address refuse a film
 * above a child's ceiling as flatly as it refuses a library they were never given.
 *
 * An administrator's owner profile passes the account's layer; a share guest, whose reach was
 * decided when the link was made, passes both. A condition of nothing composes away rather than
 * being a condition that is always true.
 *
 * @param db - The database the subquery is built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where none applies.
 */
const reachableByViewer = (db: AnyValenceDatabase, viewer: Viewer): SQL | undefined => {
  if (viewer.kind !== 'account') {
    return undefined;
  }

  const { accountId, profileId, isAdministrator } = viewer;

  const givenToTheAccount = isAdministrator
    ? undefined
    : notExists(
        db
          .select({ one: sql`1` })
          .from(libraryBlock)
          .where(
            and(
              eq(libraryBlock.userId, accountId),
              or(eq(libraryBlock.libraryId, mediaItem.libraryId), isStreamedItem(db)),
            ),
          ),
      );

  const givenToTheProfile =
    profileId === null
      ? undefined
      : notExists(
          db
            .select({ one: sql`1` })
            .from(profileLibraryBlock)
            .where(
              and(
                eq(profileLibraryBlock.profileId, profileId),
                or(eq(profileLibraryBlock.libraryId, mediaItem.libraryId), isStreamedItem(db)),
              ),
            ),
        );

  return and(givenToTheAccount, givenToTheProfile, withinTheCeiling(db, viewer));
};

export { reachableByViewer };
