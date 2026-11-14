import { ShowDetailSchema } from '@ValenceContracts/schemas/Show';
import { mediaSummaryOfJellyfinItem } from '@ValenceClient/jellyfin/mediaSummaryOfJellyfinItem';
import { showSummaryOfJellyfinSeries } from '@ValenceClient/jellyfin/showSummaryOfJellyfinSeries';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { JellyfinContext } from '@ValenceClient/jellyfin/JellyfinContext';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * A series and its episodes on a Jellyfin server, described as Valence describes a programme: its
 * summary, its story, and its episodes gathered into their seasons in order.
 *
 * @param series - The series.
 * @param episodes - Its episodes.
 * @param libraryId - The Valence identifier of its library.
 * @param context - The server, and how identifiers are turned.
 * @returns The programme.
 */
const showDetailOfJellyfin = (
  series: JellyfinItem,
  episodes: readonly JellyfinItem[],
  libraryId: string,
  context: Pick<JellyfinContext, 'address' | 'book'>,
): ShowDetail => {
  const seasons = new Map<number | null, JellyfinItem[]>();

  for (const episode of episodes) {
    const number = episode.ParentIndexNumber ?? null;

    seasons.set(number, [...(seasons.get(number) ?? []), episode]);
  }

  return ShowDetailSchema.parse({
    ...showSummaryOfJellyfinSeries(series, libraryId, context),
    seasonCount: seasons.size,
    episodeCount: episodes.length,
    seasons: [...seasons.entries()]
      .sort(
        ([one], [other]) => (one ?? Number.MAX_SAFE_INTEGER) - (other ?? Number.MAX_SAFE_INTEGER),
      )
      .map(([seasonNumber, inSeason]) => ({
        seasonNumber,
        episodes: inSeason.map((episode) =>
          mediaSummaryOfJellyfinItem(episode, libraryId, context),
        ),
      })),
    overview: series.Overview ?? null,
    certification: series.OfficialRating ?? null,
  });
};

export { showDetailOfJellyfin };
