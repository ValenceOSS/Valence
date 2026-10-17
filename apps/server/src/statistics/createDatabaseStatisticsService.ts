import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, isNull } from 'drizzle-orm';
import { PlaybackModeSchema } from '@ValenceContracts/schemas/Statistics';
import { isNotDistinctFrom } from '@ValenceDatabase/isNotDistinctFrom';
import { mediaItem, playRecord, viewerProfile, watchHistory } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { RANGE_DAYS } from './RANGE_DAYS';
import { SAME_PLAY_MS } from './SAME_PLAY_MS';
import { summariseStatistics } from './summariseStatistics';
import type { StatisticsService } from './StatisticsService';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What was watched on this server and how it was delivered, read from the watch history, the record
 * of each play's delivery, and when each title arrived.
 *
 * A play started again within a few hours on the same device — after a seek, or a change of quality
 * — is the same play, so it updates how that play was delivered rather than counting twice.
 *
 * @param db - The database to read and write.
 * @param now - The clock.
 * @returns The statistics service.
 */
const createDatabaseStatisticsService = (
  db: AnyValenceDatabase,
  now: () => Date = () => new Date(),
): StatisticsService => ({
  recordPlay: async (play) => {
    const at = now();
    const [recent] = await db
      .select({ id: playRecord.id })
      .from(playRecord)
      .where(
        and(
          eq(playRecord.mediaItemId, play.mediaItemId),
          isNotDistinctFrom(playRecord.profileId, play.profileId),
          isNotDistinctFrom(playRecord.client, play.client),
          gte(playRecord.at, new Date(at.getTime() - SAME_PLAY_MS)),
        ),
      )
      .orderBy(desc(playRecord.at))
      .limit(1);

    if (recent !== undefined) {
      await db
        .update(playRecord)
        .set({ mode: play.mode, reasons: [...play.reasons] })
        .where(eq(playRecord.id, recent.id));

      return;
    }

    await db.insert(playRecord).values({
      id: randomUUID(),
      at,
      profileId: play.profileId,
      mediaItemId: play.mediaItemId,
      mode: play.mode,
      reasons: [...play.reasons],
      client: play.client,
    });
  },
  read: async (range, zone) => {
    const end = now();
    const from = new Date(end.getTime() - RANGE_DAYS[range] * DAY_MS);

    const [viewings, plays, added] = await Promise.all([
      db
        .select({
          mediaItemId: watchHistory.mediaItemId,
          title: mediaItem.title,
          seriesId: mediaItem.seriesId,
          seriesTitle: mediaItem.seriesTitle,
          profileId: watchHistory.profileId,
          profileName: viewerProfile.name,
          startedAt: watchHistory.startedAt,
          secondsWatched: watchHistory.secondsWatched,
        })
        .from(watchHistory)
        .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
        .leftJoin(viewerProfile, eq(viewerProfile.id, watchHistory.profileId))
        .where(gte(watchHistory.startedAt, from)),
      db
        .select({
          at: playRecord.at,
          mode: playRecord.mode,
          reasons: playRecord.reasons,
          client: playRecord.client,
        })
        .from(playRecord)
        .where(gte(playRecord.at, from)),
      db
        .select({ addedAt: mediaItem.addedAt })
        .from(mediaItem)
        .where(and(gte(mediaItem.addedAt, from), isNull(mediaItem.extraKind))),
    ]);

    return summariseStatistics({
      range,
      zone,
      now: end,
      viewings,
      plays: plays.flatMap((play) => {
        const mode = PlaybackModeSchema.safeParse(play.mode);

        return mode.success ? [{ ...play, mode: mode.data }] : [];
      }),
      added: added.map((row) => row.addedAt),
    });
  },
});

export { createDatabaseStatisticsService };
