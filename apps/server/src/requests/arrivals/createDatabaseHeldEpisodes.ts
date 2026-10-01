import { and, eq, isNotNull } from 'drizzle-orm';
import { mediaItem, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HeldEpisode } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Every episode the libraries hold of a series, by its catalogue id, a double episode counting as
 * each of the episodes it spans.
 *
 * @param db - The database.
 * @returns How to read the episodes of a series.
 */
const createDatabaseHeldEpisodes =
  (db: AnyValenceDatabase) =>
  async (tmdbId: string): Promise<HeldEpisode[]> => {
    const rows = await db
      .select({
        season: mediaItem.seasonNumber,
        episode: mediaItem.episodeNumber,
        last: mediaItem.episodeNumberEnd,
      })
      .from(mediaItem)
      .innerJoin(series, eq(mediaItem.seriesId, series.id))
      .where(
        and(
          eq(series.externalId, tmdbId),
          isNotNull(mediaItem.seasonNumber),
          isNotNull(mediaItem.episodeNumber),
        ),
      );

    return rows.flatMap(({ season, episode, last }) => {
      if (season === null || episode === null) {
        return [];
      }

      const through = last !== null && last > episode ? last : episode;

      return Array.from({ length: through - episode + 1 }, (_, offset) => ({
        season,
        episode: episode + offset,
      }));
    });
  };

export { createDatabaseHeldEpisodes };
