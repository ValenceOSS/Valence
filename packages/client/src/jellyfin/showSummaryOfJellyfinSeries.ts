import { ShowSummarySchema } from '@ValenceContracts/schemas/Show';
import { artworkOfJellyfinItem } from '@ValenceClient/jellyfin/artworkOfJellyfinItem';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';
import type { JellyfinContext } from '@ValenceClient/jellyfin/JellyfinContext';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * A series on a Jellyfin server, summarised as Valence summarises a programme. Valence's apps fetch
 * a programme's pictures through the episode that stands for it, so the programme stands for
 * itself, under its own identifier.
 *
 * @param series - The series, as Jellyfin describes it.
 * @param libraryId - The Valence identifier of its library.
 * @param context - The server, and how identifiers are turned.
 * @returns The summary.
 */
const showSummaryOfJellyfinSeries = (
  series: JellyfinItem,
  libraryId: string,
  context: Pick<JellyfinContext, 'address' | 'book'>,
): ShowSummary => {
  const id = context.book.valenceIdOf(series.Id);
  const artwork = artworkOfJellyfinItem(series, context.address);
  const added = new Date(series.DateCreated ?? 0);

  return ShowSummarySchema.parse({
    id,
    libraryId,
    title: series.Name ?? series.Id,
    seasonCount: series.ChildCount ?? 0,
    episodeCount: series.RecursiveItemCount ?? 0,
    latestAddedAt: (Number.isNaN(added.getTime()) ? new Date(0) : added).toISOString(),
    coverMediaId: id,
    artwork: {
      ...(artwork.poster === undefined ? {} : { poster: artwork.poster }),
      ...(artwork.backdrop === undefined ? {} : { titleBackdrop: artwork.backdrop }),
      ...(artwork.logo === undefined ? {} : { logo: artwork.logo }),
    },
    seriesId: id,
    year: series.ProductionYear ?? null,
    rating: series.CommunityRating ?? null,
    genres: series.Genres ?? null,
    unwatchedCount: series.UserData?.UnplayedItemCount ?? null,
  });
};

export { showSummaryOfJellyfinSeries };
