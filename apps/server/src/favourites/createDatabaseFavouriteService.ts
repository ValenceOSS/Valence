import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { favourite } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { FavouriteService } from './FavouriteService';

const LIMIT = 500;

/**
 * What each profile has kept, held in Postgres — the list a favourites page is built from.
 *
 * Films, episodes and songs are kept by their media item, and books by the book, each in its own
 * column of the same table, so one list of what somebody kept holds everything they kept.
 *
 * @param db - The database to read and write.
 * @returns The favourite service.
 */
const createDatabaseFavouriteService = (db: ValenceDatabase): FavouriteService => ({
  list: async (profileId) => {
    const rows = await db
      .select()
      .from(favourite)
      .where(and(eq(favourite.profileId, profileId), isNotNull(favourite.mediaItemId)))
      .orderBy(desc(favourite.keptAt))
      .limit(LIMIT);

    return rows.flatMap((row) =>
      row.mediaItemId === null
        ? []
        : [{ mediaId: row.mediaItemId, keptAt: row.keptAt.toISOString() }],
    );
  },

  keep: async (profileId, mediaId) => {
    await db
      .insert(favourite)
      .values({
        id: randomUUID(),
        profileId,
        mediaItemId: mediaId,
        keptAt: new Date(),
      })
      .onConflictDoNothing({ target: [favourite.profileId, favourite.mediaItemId] });
  },

  drop: async (profileId, mediaId) => {
    await db
      .delete(favourite)
      .where(and(eq(favourite.profileId, profileId), eq(favourite.mediaItemId, mediaId)));
  },

  listBooks: async (profileId) => {
    const rows = await db
      .select()
      .from(favourite)
      .where(and(eq(favourite.profileId, profileId), isNotNull(favourite.bookId)))
      .orderBy(desc(favourite.keptAt))
      .limit(LIMIT);

    return rows.flatMap((row) =>
      row.bookId === null ? [] : [{ bookId: row.bookId, keptAt: row.keptAt.toISOString() }],
    );
  },

  keepBook: async (profileId, bookId) => {
    await db
      .insert(favourite)
      .values({ id: randomUUID(), profileId, bookId, keptAt: new Date() })
      .onConflictDoNothing({
        target: [favourite.profileId, favourite.bookId],
         
        where: sql`${favourite.bookId} is not null`,
      });
  },

  dropBook: async (profileId, bookId) => {
    await db
      .delete(favourite)
      .where(and(eq(favourite.profileId, profileId), eq(favourite.bookId, bookId)));
  },
});

export { createDatabaseFavouriteService };
