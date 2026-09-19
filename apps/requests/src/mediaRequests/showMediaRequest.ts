import { describeRequestState } from '@ValenceRequests/mediaRequests/describeRequestState';
import { releaseDateOf } from '@ValenceRequests/mediaRequests/releaseDateOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * A request as it is shown: where it has got to as a whole, who asked, the day a film is held
 * until, and each film or episode in the order it comes.
 *
 * @param record - The request as kept.
 * @param items - Its films or episodes.
 * @returns It as shown.
 */
const showMediaRequest = (
  record: MediaRequestRecord,
  items: readonly RequestItemRecord[],
): MediaRequest => ({
  id: record.id,
  kind: record.kind,
  tmdbId: record.tmdbId,
  title: record.title,
  year: record.year,
  overview: record.overview,
  posterUrl: record.posterUrl,
  libraryId: record.libraryId,
  profileId: record.profileId,
  isPickedByHand: record.isPickedByHand,
  ...describeRequestState(record, items),
  approval: record.approval,
  refusedBecause: record.refusedBecause,
  requestedBy: { id: record.requestedById, name: record.requestedByName },
  seasons: record.seasons,
  waitFor: record.waitFor,
  releaseDate: releaseDateOf(record),
  items: items
    .toSorted(
      (left, right) =>
        (left.season ?? 0) - (right.season ?? 0) || (left.episode ?? 0) - (right.episode ?? 0),
    )
    .map((item) => ({
      id: item.id,
      season: item.season,
      episode: item.episode,
      title: item.title,
      airDate: item.airDate,
      state: item.state,
      problem: item.problem,
      releaseTitle: item.releaseTitle,
      downloadId: item.downloadId,
      filePath: item.filePath,
      score: item.score,
      lastSearchedAt: item.lastSearchedAt,
      updatedAt: item.updatedAt,
    })),
  mediaId: record.mediaId,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export { showMediaRequest };
