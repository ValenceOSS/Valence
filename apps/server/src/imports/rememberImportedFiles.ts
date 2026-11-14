import { inArray } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ItemMatch } from '@ValenceServer/imports/matchSourceItem';
import type { MediaOriginStore } from '@ValenceServer/origins/MediaOriginStore';

const MOST_AT_ONCE = 500;

/**
 * Records that each file an import matched was brought across from that source, so it says so
 * when it is listed; a file whose origin is already known keeps it.
 *
 * @param db - The database.
 * @param origins - Where origins are kept.
 * @param matches - What each source item matched.
 * @param source - The name of the server it was imported from.
 */
const rememberImportedFiles = async (
  db: AnyValenceDatabase,
  origins: Pick<MediaOriginStore, 'recordUnlessKnown'>,
  matches: ReadonlyMap<string, ItemMatch>,
  source: string,
): Promise<void> => {
  const ids = [
    ...new Set(
      [...matches.values()].flatMap((match) => (match.kind === 'item' ? [match.mediaItemId] : [])),
    ),
  ];

  for (let at = 0; at < ids.length; at += MOST_AT_ONCE) {
    const files = await db
      .select({ libraryId: mediaItem.libraryId, path: mediaItem.path })
      .from(mediaItem)
      .where(inArray(mediaItem.id, ids.slice(at, at + MOST_AT_ONCE)));

    await origins.recordUnlessKnown(
      files.map((file) => ({ ...file, source: 'import', via: source })),
    );
  }
};

export { rememberImportedFiles };
