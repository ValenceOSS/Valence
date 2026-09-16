import { and, eq, notExists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { libraryBlock, mediaItem } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import { withinTheCeiling } from '@ValenceServer/visibility/withinTheCeiling';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whether an item is in a library this account is allowed to reach at all.
 *
 * This is the enforcement half, and the half a viewer cannot lift. It belongs to the account rather
 * than the person watching, because profiles are not a security boundary — anybody holding the
 * account may pick any face, so a restriction attached to a face is a restriction attached to
 * nothing.
 *
 * Access is stored as refusals rather than grants, which is what makes the default right: every
 * account reaches every library until somebody says otherwise, a new account needs no second step
 * before it can watch anything, and a household of adults configures nothing. Storing grants would
 * mean a row per account per library and a backfill for every library ever added.
 *
 * Carries the age ceiling too, since both are enforcement an account cannot lift and both decide the
 * same question: whether this item may be reached at all. Keeping them together is what makes the
 * gate on a direct address refuse a film above a child's ceiling as flatly as it refuses a library
 * they were never given.
 *
 * Answers with nothing where there is nothing to enforce — an administrator, who reaches
 * everything, or a share guest, whose reach was decided when the link was made. A condition of
 * nothing composes away rather than being a condition that is always true.
 *
 * @param db - The database the subquery is built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where none applies.
 */
const reachableByViewer = (db: ValenceDatabase, viewer: Viewer): SQL | undefined => {
  if (viewer.kind !== 'account' || viewer.isAdministrator) {
    return undefined;
  }

  const { accountId } = viewer;

  return and(
    notExists(
      db
        .select({ one: sql`1` })
        .from(libraryBlock)
        .where(
          and(eq(libraryBlock.userId, accountId), eq(libraryBlock.libraryId, mediaItem.libraryId)),
        ),
    ),
    withinTheCeiling(db, viewer),
  );
};

export { reachableByViewer };
