import { randomUUID } from 'node:crypto';
import { and, count, eq, gte, max } from 'drizzle-orm';
import { musicPlay } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MusicPlays } from './MusicPlays';

/**
 * The songs each profile has heard, kept one row a hearing, which is what the mixes Valence makes
 * are drawn from: what has been on repeat lately, what was loved and has gone quiet, and which
 * artists are heard together.
 *
 * @param db - The database.
 * @returns The record of hearings.
 */
const createDatabaseMusicPlays = (db: AnyValenceDatabase): MusicPlays => ({
  record: async (profileId, trackId) => {
    await db.insert(musicPlay).values({ id: randomUUID(), profileId, trackId });
  },

  countsSince: async (profileId, sinceMs) => {
    const rows = await db
      .select({ trackId: musicPlay.trackId, plays: count(), last: max(musicPlay.playedAt) })
      .from(musicPlay)
      .where(and(eq(musicPlay.profileId, profileId), gte(musicPlay.playedAt, new Date(sinceMs))))
      .groupBy(musicPlay.trackId);

    return rows.map((row) => ({
      trackId: row.trackId,
      plays: Number(row.plays),
      lastPlayedAtMs: row.last === null ? 0 : new Date(row.last).getTime(),
    }));
  },
});

export { createDatabaseMusicPlays };
