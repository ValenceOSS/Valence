import { countAffected } from '@ValenceDatabase/countAffected';
import { and, eq, inArray } from 'drizzle-orm';
import { playlist } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Removes the playlists that belonged to profiles which are about to go, keeping the ones the rest
 * of the household can see.
 *
 * The foreign key leaves every playlist behind with no owner, which is right for a shared one and
 * waste for a private one nobody else could ever read. This is what tells the two apart, and it has
 * to run before the profiles go rather than after, while there is still a row saying whose they
 * were.
 *
 * @param db - The database.
 * @param profileIds - The profiles being removed.
 * @returns How many playlists were removed.
 */
const dropPrivatePlaylistsOf = async (
  db: AnyValenceDatabase,
  profileIds: readonly string[],
): Promise<number> => {
  if (profileIds.length === 0) {
    return 0;
  }

  const dropped = await db
    .delete(playlist)
    .where(and(inArray(playlist.profileId, [...profileIds]), eq(playlist.isShared, false)));

  return countAffected(dropped);
};

export { dropPrivatePlaylistsOf };
