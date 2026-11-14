import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { artworkOfJellyfinItem } from '@ValenceClient/jellyfin/artworkOfJellyfinItem';
import { secondsOfJellyfinTicks } from '@ValenceClient/jellyfin/secondsOfJellyfinTicks';
import { videoRangeOfJellyfin } from '@ValenceClient/jellyfin/videoRangeOfJellyfin';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { JellyfinContext } from '@ValenceClient/jellyfin/JellyfinContext';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

const EARLIEST_YEAR = 1870;

const LATEST_YEAR = 2200;

const WIDE = 1920;

const HIGH = 1080;

/**
 * A film or an episode from a Jellyfin server, summarised as Valence summarises one, with
 * identifiers Valence's apps accept and its pictures fetched from the server itself.
 *
 * @param item - The item, as Jellyfin describes it.
 * @param libraryId - The Valence identifier of the library it was found in.
 * @param context - The server, and how identifiers are turned.
 * @returns The summary.
 */
const mediaSummaryOfJellyfinItem = (
  item: JellyfinItem,
  libraryId: string,
  context: Pick<JellyfinContext, 'address' | 'book'>,
): MediaSummary => {
  const source = item.MediaSources?.[0];
  const video = source?.MediaStreams?.find((stream) => stream.Type === 'Video');
  const year = item.ProductionYear ?? null;
  const added = new Date(item.DateCreated ?? 0);
  const isEpisode = item.Type === 'Episode';
  const tmdb = item.ProviderIds?.['Tmdb'] ?? null;

  return MediaSummarySchema.parse({
    id: context.book.valenceIdOf(item.Id),
    libraryId,
    title: item.Name ?? item.SortName ?? item.Id,
    sortTitle: item.SortName ?? null,
    year: year !== null && year >= EARLIEST_YEAR && year <= LATEST_YEAR ? year : null,
    durationSeconds: Math.max(1, secondsOfJellyfinTicks(item.RunTimeTicks ?? source?.RunTimeTicks)),
    width: Math.max(1, item.Width ?? video?.Width ?? WIDE),
    height: Math.max(1, item.Height ?? video?.Height ?? HIGH),
    videoCodec: video?.Codec ?? 'h264',
    videoRange: videoRangeOfJellyfin(video?.VideoRangeType),
    addedAt: (Number.isNaN(added.getTime()) ? new Date(0) : added).toISOString(),
    hasPoster: item.ImageTags?.['Primary'] !== undefined,
    hasBackdrop: (item.BackdropImageTags?.length ?? 0) > 0,
    hasLogo: item.ImageTags?.['Logo'] !== undefined,
    artwork: artworkOfJellyfinItem(item, context.address),
    seriesId:
      isEpisode && item.SeriesId !== null && item.SeriesId !== undefined
        ? context.book.valenceIdOf(item.SeriesId)
        : null,
    seriesTitle: isEpisode ? (item.SeriesName ?? null) : null,
    seasonNumber: isEpisode ? (item.ParentIndexNumber ?? null) : null,
    episodeNumber: isEpisode ? (item.IndexNumber ?? null) : null,
    episodeNumberEnd: isEpisode ? (item.IndexNumberEnd ?? null) : null,
    rating: item.CommunityRating ?? null,
    genres: item.Genres ?? null,
    externalId: tmdb,
    sizeBytes: source?.Size ?? null,
    releaseDate: item.PremiereDate ?? null,
  });
};

export { mediaSummaryOfJellyfinItem };
