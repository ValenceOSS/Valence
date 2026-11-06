import { eq } from 'drizzle-orm';
import { mediaItem, seasonSource, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { folderOfSeriesKey } from './folderOfSeriesKey';
import type { SeasonSourceRow } from './SeasonSourceRow.types';

/**
 * Reads where each season of a file's programme is read from when somebody said it is another
 * catalogue entry's.
 *
 * @param db - The database.
 * @param mediaId - Any file of the programme.
 * @returns The file's library, programme and season, and the seasons read from elsewhere, or null
 *   where the file is not an episode of a programme kept in a folder of its own, which is how a scan
 *   finds which programme a new file belongs to.
 */
const seasonSourcesOfFile = async (
  db: AnyValenceDatabase,
  mediaId: string,
): Promise<{
  libraryId: string;
  seriesId: string;
  seasonNumber: number | null;
  sources: SeasonSourceRow[];
} | null> => {
  const [row] = await db
    .select({
      libraryId: mediaItem.libraryId,
      seasonNumber: mediaItem.seasonNumber,
      seriesId: series.id,
      key: series.key,
    })
    .from(mediaItem)
    .innerJoin(series, eq(series.id, mediaItem.seriesId))
    .where(eq(mediaItem.id, mediaId))
    .limit(1);
  const folder = row === undefined ? null : folderOfSeriesKey(row.key);

  if (row === undefined || folder === null) {
    return null;
  }

  const sources = await db
    .select({
      seasonNumber: seasonSource.seasonNumber,
      externalId: seasonSource.externalId,
      externalSeason: seasonSource.externalSeason,
      title: seasonSource.title,
      year: seasonSource.year,
    })
    .from(seasonSource)
    .where(eq(seasonSource.seriesId, row.seriesId));

  return {
    libraryId: row.libraryId,
    seriesId: row.seriesId,
    seasonNumber: row.seasonNumber,
    sources: sources.map((one) => ({ ...one, folder })),
  };
};

export { seasonSourcesOfFile };
