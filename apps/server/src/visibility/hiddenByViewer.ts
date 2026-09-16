import { and, eq, exists, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { hidden, mediaItem } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whether the person watching has put this item out of their own sight.
 *
 * This is the preference half, and it is deliberately not enforcement: it belongs to the profile
 * rather than the account, the viewer chose it, and they can undo it. Nothing here stops anybody
 * reaching an item they have hidden by its own address — hiding tidies a view, it does not lock a
 * door, and building it as though it did would invite somebody to use it as a parental control and
 * be wrong.
 *
 * One row can mean a film, a programme or a whole library, which is why it is asked as three
 * comparisons rather than one. Hiding a library is the cheapest of the three by a distance:
 * somebody who never watches television hides one thing and gets a home page that is theirs.
 *
 * A comparison against a column that is null answers null rather than true, so a film with no
 * programme is not caught by somebody having hidden a programme, and a row naming a library does
 * not catch every item by its identifier. That is the same reason the three sit under `or` rather
 * than being narrowed by which kind of row it is.
 *
 * Answers with nothing where there is nobody to have hidden anything — a share guest, or a server
 * keeping no profiles at all.
 *
 * @param db - The database the subquery is built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where none applies.
 */
const hiddenByViewer = (db: ValenceDatabase, viewer: Viewer): SQL | undefined => {
  if (viewer.kind !== 'account' || viewer.profileId === null) {
    return undefined;
  }

  const { profileId } = viewer;

  return exists(
    db
      .select({ one: sql`1` })
      .from(hidden)
      .where(
        and(
          eq(hidden.profileId, profileId),
          or(
            eq(hidden.mediaItemId, mediaItem.id),
            eq(hidden.seriesId, mediaItem.seriesId),
            eq(hidden.libraryId, mediaItem.libraryId),
          ),
        ),
      ),
  );
};

export { hiddenByViewer };
