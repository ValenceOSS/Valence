import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { watchHistory, mediaItem } from '#dialect/Schema';
import { decideViewing } from './decideViewing';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HistoryService, Viewing } from './HistoryService';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';

type Row = {
  id: string;
  mediaItemId: string;
  title: string | null;
  seriesTitle: string | null;
  seriesId: string | null;
  startedAt: Date;
  lastWatchedAt: Date;
  secondsWatched: number;
  isFinished: boolean;
};

/**
 * Turns a viewing row into what the contract carries, which is chiefly a matter of writing its
 * timestamps as strings.
 *
 * @param row - The row as stored.
 * @returns The viewing, as the API describes one.
 */
const shown = (row: Row): Viewing => ({
  id: row.id,
  mediaItemId: row.mediaItemId,
  title: row.title,
  seriesTitle: row.seriesTitle,
  seriesId: row.seriesId,
  startedAt: row.startedAt.toISOString(),
  lastWatchedAt: row.lastWatchedAt.toISOString(),
  secondsWatched: row.secondsWatched,
  isFinished: row.isFinished,
});

/**
 * What each profile has actually watched and when, held in Postgres — one entry per viewing rather
 * than per report, so an evening's watching reads as an evening rather than as hundreds of ticks.
 *
 * @param db - The database to read and write.
 * @returns The history service.
 */
const createDatabaseHistoryService = (db: AnyValenceDatabase): HistoryService => {
  /**
   * Reads one viewing back after it was written, since not every database hands the row back from
   * the write itself.
   *
   * @param id - The viewing.
   * @returns The viewing as the contract carries it, or null where it has gone.
   */
  const readViewing = async (id: string): Promise<Viewing | null> => {
    const [row] = await db.select().from(watchHistory).where(eq(watchHistory.id, id));

    return row === undefined
      ? null
      : shown({ ...row, title: null, seriesTitle: null, seriesId: null });
  };

  return {
    record: async (profileId, mediaItemId, seen) => {
      const [open] = await db
        .select({
          id: watchHistory.id,
          mediaItemId: watchHistory.mediaItemId,
          startedAt: watchHistory.startedAt,
          lastWatchedAt: watchHistory.lastWatchedAt,
          secondsWatched: watchHistory.secondsWatched,
          isFinished: watchHistory.isFinished,
        })
        .from(watchHistory)
        .where(
          and(eq(watchHistory.profileId, profileId), eq(watchHistory.mediaItemId, mediaItemId)),
        )
        .orderBy(desc(watchHistory.lastWatchedAt))
        .limit(1);

      const decided = decideViewing(
        open === undefined
          ? null
          : {
              id: open.id,
              lastWatchedAt: open.lastWatchedAt,
              secondsWatched: open.secondsWatched,
              isFinished: open.isFinished,
            },
        seen,
      );

      if (decided.kind === 'ignore') {
        return null;
      }

      if (decided.kind === 'extend') {
        await db
          .update(watchHistory)
          .set({
            secondsWatched: decided.secondsWatched,
            isFinished: decided.isFinished,
            lastWatchedAt: seen.at,
          })
          .where(eq(watchHistory.id, decided.id));

        return readViewing(decided.id);
      }

      const id = randomUUID();

      await db.insert(watchHistory).values({
        id,
        profileId,
        mediaItemId,
        startedAt: seen.at,
        lastWatchedAt: seen.at,
        secondsWatched: decided.secondsWatched,
        isFinished: decided.isFinished,
      });

      return readViewing(id);
    },

    list: async (viewer, profileId, options = {}) => {
      const rows = await db
        .select({
          id: watchHistory.id,
          mediaItemId: watchHistory.mediaItemId,
          title: mediaItem.title,
          seriesTitle: mediaItem.seriesTitle,
          seriesId: mediaItem.seriesId,
          startedAt: watchHistory.startedAt,
          lastWatchedAt: watchHistory.lastWatchedAt,
          secondsWatched: watchHistory.secondsWatched,
          isFinished: watchHistory.isFinished,
        })
        .from(watchHistory)
        .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
        .where(and(eq(watchHistory.profileId, profileId), visibleToViewer(db, viewer)))
        .orderBy(desc(watchHistory.lastWatchedAt))
        .limit(options.limit ?? 50)
        .offset(options.offset ?? 0);

      return rows.map(shown);
    },

    forget: async (profileId, viewingId) => {
      const gone = await db
        .delete(watchHistory)
        .where(and(eq(watchHistory.id, viewingId), eq(watchHistory.profileId, profileId)));

      return countAffected(gone) > 0;
    },

    prune: async (before) => {
      const gone = await db
        .delete(watchHistory)
        .where(and(lt(watchHistory.lastWatchedAt, before), isNull(watchHistory.importedFrom)));

      return countAffected(gone);
    },

    forgetAll: async (profileId) => {
      const gone = await db.delete(watchHistory).where(eq(watchHistory.profileId, profileId));

      return countAffected(gone);
    },
  };
};

export { createDatabaseHistoryService };
