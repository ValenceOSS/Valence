import { sql } from 'drizzle-orm';
import { mediaArtworkChoice, mediaItem } from '#dialect/Schema';
import { qualified } from '@ValenceDatabase/qualified';

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
  >`(select ${qualified(mediaArtworkChoice.url)} from ${mediaArtworkChoice} where ${qualified(mediaArtworkChoice.libraryId)} = ${qualified(mediaItem.libraryId)} and ${qualified(mediaArtworkChoice.externalKind)} = 'tv' and ${qualified(mediaArtworkChoice.externalId)} = ${qualified(mediaItem.externalId)} and ${qualified(mediaArtworkChoice.kind)} = 'backdrop' and ${qualified(mediaItem.seriesTitle)} is not null limit 1)`,
};

export { SUMMARY_COLUMNS };
