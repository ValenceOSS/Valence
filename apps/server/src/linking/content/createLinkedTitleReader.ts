import { eq } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import { readLinkedAddress } from '@ValenceServer/linking/catalogue/readLinkedAddress';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { LinkedTitle } from './createLinkedPlayback';

const MOST_REMEMBERED = 5000;

const TITLE_ROUTE = /^\/api\/media\/([0-9a-fA-F-]{36})$/u;

/**
 * Which linked server a title is from and what it calls it, read from where the title is kept, or
 * nothing where it is this server's own. Remembered, since a title's place never changes and a
 * player asks for every segment of it.
 *
 * @param db - The database.
 * @returns The reader.
 */
const createLinkedTitleReader = (db: AnyValenceDatabase) => {
  const known = new Map<string, LinkedTitle | null>();

  return async (mediaId: string): Promise<LinkedTitle | null> => {
    const remembered = known.get(mediaId);

    if (remembered !== undefined) {
      return remembered;
    }

    const [row] = await db
      .select({ path: mediaItem.path })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId));
    const linked = row === undefined ? null : readLinkedAddress(row.path);
    const remoteId = linked === null ? undefined : TITLE_ROUTE.exec(linked.route)?.[1];
    const title =
      linked === null || remoteId === undefined ? null : { serverId: linked.serverId, remoteId };

    if (row !== undefined) {
      if (known.size >= MOST_REMEMBERED) {
        known.clear();
      }

      known.set(mediaId, title);
    }

    return title;
  };
};

export { createLinkedTitleReader };
