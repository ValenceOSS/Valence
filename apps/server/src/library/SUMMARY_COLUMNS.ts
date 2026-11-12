import { sql } from 'drizzle-orm';
import { mediaArtworkChoice, mediaItem } from '#dialect/Schema';

const SUMMARY_COLUMNS = {
  id: mediaItem.id,
  libraryId: mediaItem.libraryId,
  title: mediaItem.title,
  sortTitle: mediaItem.sortTitle,
  year: mediaItem.year,
  durationSeconds: mediaItem.durationSeconds,
  width: mediaItem.width,
  height: mediaItem.height,
  videoCodec: mediaItem.videoCodec,
  videoRange: mediaItem.videoRange,
  audioStreams: mediaItem.audioStreams,
  addedAt: mediaItem.addedAt,
  posterUrl: mediaItem.posterUrl,
  artworkChangedAt: mediaItem.artworkChangedAt,
  backdropUrl: mediaItem.backdropUrl,
  logoUrl: mediaItem.logoUrl,
  seriesId: mediaItem.seriesId,
  seriesTitle: mediaItem.seriesTitle,
  seriesSortTitle: mediaItem.seriesSortTitle,
  seasonNumber: mediaItem.seasonNumber,
  episodeNumber: mediaItem.episodeNumber,
  episodeNumberEnd: mediaItem.episodeNumberEnd,
  releaseDate: mediaItem.releaseDate,
  rating: mediaItem.rating,
  externalId: mediaItem.externalId,
  genres: mediaItem.genres,
  titleBackdropUrl: sql<
    string | null
  >`(select ${mediaArtworkChoice.url} from ${mediaArtworkChoice} where ${mediaArtworkChoice.libraryId} = ${mediaItem.libraryId} and ${mediaArtworkChoice.externalKind} = 'tv' and ${mediaArtworkChoice.externalId} = ${mediaItem.externalId} and ${mediaArtworkChoice.kind} = 'backdrop' and ${mediaItem.seriesTitle} is not null)`,
};

export { SUMMARY_COLUMNS };
