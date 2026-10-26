import { mediaItem } from '#dialect/Schema';

const SUMMARY_COLUMNS = {
  id: mediaItem.id,
  libraryId: mediaItem.libraryId,
  title: mediaItem.title,
  year: mediaItem.year,
  durationSeconds: mediaItem.durationSeconds,
  width: mediaItem.width,
  height: mediaItem.height,
  videoCodec: mediaItem.videoCodec,
  videoRange: mediaItem.videoRange,
  addedAt: mediaItem.addedAt,
  posterUrl: mediaItem.posterUrl,
  artworkChangedAt: mediaItem.artworkChangedAt,
  backdropUrl: mediaItem.backdropUrl,
  logoUrl: mediaItem.logoUrl,
  seriesId: mediaItem.seriesId,
  seriesTitle: mediaItem.seriesTitle,
  seasonNumber: mediaItem.seasonNumber,
  episodeNumber: mediaItem.episodeNumber,
  episodeNumberEnd: mediaItem.episodeNumberEnd,
  releaseDate: mediaItem.releaseDate,
  rating: mediaItem.rating,
  externalId: mediaItem.externalId,
  genres: mediaItem.genres,
};

export { SUMMARY_COLUMNS };
