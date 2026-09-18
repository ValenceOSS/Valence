import { and, eq, inArray } from 'drizzle-orm';
import { playlist } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';

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
  db: ValenceDatabase,
  profileIds: readonly string[],
): Promise<number> => {
  if (profileIds.length === 0) {
    return 0;
  }

  const dropped = await db
    .delete(playlist)
    .where(and(inArray(playlist.profileId, [...profileIds]), eq(playlist.isShared, false)))
    .returning({ id: playlist.id });

  return dropped.length;
};

export { dropPrivatePlaylistsOf };
