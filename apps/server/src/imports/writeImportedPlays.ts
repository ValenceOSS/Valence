import { randomUUID } from 'node:crypto';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { watchHistory } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type ImportedPlay = {
  profileId: string;
  mediaItemId: string;
  at: Date;
  secondsWatched: number;
  importKey: string;
};

const AT_ONCE = 200;

/**
 * Writes viewings from the old server into history with their own dates, marked as imported so the
 * yearly cleanup keeps them, once each however often the import runs.
 *
 * @param db - The database.
 * @param importedFrom - Which source they came from.
 * @param plays - The viewings, each with the key that makes it the same viewing next time.
 */
const writeImportedPlays = async (
  db: AnyValenceDatabase,
  importedFrom: string,
  plays: readonly ImportedPlay[],
): Promise<void> => {
  for (let start = 0; start < plays.length; start += AT_ONCE) {
    const batch = plays.slice(start, start + AT_ONCE);

    await insertUnlessPresent(db, watchHistory, {
      values: batch.map((play) => ({
        id: randomUUID(),
        profileId: play.profileId,
        mediaItemId: play.mediaItemId,
        startedAt: new Date(play.at.getTime() - play.secondsWatched * 1000),
        lastWatchedAt: play.at,
        secondsWatched: play.secondsWatched,
        isFinished: true,
        importedFrom,
        importKey: play.importKey,
      })),
      target: watchHistory.importKey,
    });
  }
};

export type { ImportedPlay };

export { writeImportedPlays };
