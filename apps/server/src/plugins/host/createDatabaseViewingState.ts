import { and, count, eq, inArray, max, or } from 'drizzle-orm';
import { favourite, favouriteArtist, musicPlay, rating, watchHistory } from '#dialect/Schema';
import type { ViewingState } from '@ValenceSDK/host/ValenceHost';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';

/**
 * Where a person stands with things in the library, for a plugin acting for them: what they kept as
 * a favourite, the stars they gave, and how many times and how lately they played a song or
 * finished a film or an episode.
 *
 * @param db - The database.
 * @returns How a plugin reads it, for one person and up to a page of things at once.
 */
const createDatabaseViewingState =
  (db: AnyValenceDatabase): PluginHost['viewing']['state'] =>
  async (profileId, mediaIds) => {
    const ids = [...new Set(mediaIds)];

    if (ids.length === 0) {
      return [];
    }

    const [kept, keptArtists, rated, played, watched] = await Promise.all([
      db
        .select({ mediaItemId: favourite.mediaItemId, bookId: favourite.bookId })
        .from(favourite)
        .where(
          and(
            eq(favourite.profileId, profileId),
            or(inArray(favourite.mediaItemId, ids), inArray(favourite.bookId, ids)),
          ),
        ),
      db
        .select({ artistId: favouriteArtist.artistId })
        .from(favouriteArtist)
        .where(
          and(eq(favouriteArtist.profileId, profileId), inArray(favouriteArtist.artistId, ids)),
        ),
      db
        .select({
          mediaItemId: rating.mediaItemId,
          seriesId: rating.seriesId,
          bookId: rating.bookId,
          stars: rating.stars,
        })
        .from(rating)
        .where(
          and(
            eq(rating.profileId, profileId),
            or(
              inArray(rating.mediaItemId, ids),
              inArray(rating.seriesId, ids),
              inArray(rating.bookId, ids),
            ),
          ),
        ),
      db
        .select({ id: musicPlay.trackId, plays: count(), at: max(musicPlay.playedAt) })
        .from(musicPlay)
        .where(and(eq(musicPlay.profileId, profileId), inArray(musicPlay.trackId, ids)))
        .groupBy(musicPlay.trackId),
      db
        .select({
          id: watchHistory.mediaItemId,
          plays: count(),
          at: max(watchHistory.lastWatchedAt),
        })
        .from(watchHistory)
        .where(
          and(
            eq(watchHistory.profileId, profileId),
            eq(watchHistory.isFinished, true),
            inArray(watchHistory.mediaItemId, ids),
          ),
        )
        .groupBy(watchHistory.mediaItemId),
    ]);
    const playsOf = new Map([...played, ...watched].map((row) => [row.id, row]));
    const favourites = new Set([
      ...kept.flatMap((row) => [row.mediaItemId, row.bookId].filter((id) => id !== null)),
      ...keptArtists.map((row) => row.artistId),
    ]);

    return ids.map((mediaId): ViewingState => {
      const plays = playsOf.get(mediaId);

      return {
        mediaId,
        isFavourite: favourites.has(mediaId),
        stars:
          rated.find(
            (row) =>
              row.mediaItemId === mediaId || row.seriesId === mediaId || row.bookId === mediaId,
          )?.stars ?? null,
        plays: plays?.plays ?? 0,
        lastPlayedAt: plays?.at?.toISOString() ?? null,
      };
    });
  };

export { createDatabaseViewingState };
