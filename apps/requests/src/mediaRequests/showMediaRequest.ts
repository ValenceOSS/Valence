import { describeRequestState } from '@ValenceRequests/mediaRequests/describeRequestState';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * A request as it is shown: where it has got to as a whole, who asked, the quality it will be judged
 * at, the day a film or an album is held until, and each film, episode or album in the order it
 * comes.
 *
 * The quality is named rather than left as an id, because whoever reads it cannot look the id up:
 * the profiles are the operator's, and somebody asking is only ever shown the few that are theirs.
 *
 * @param record - The request as kept.
 * @param items - Its films or episodes.
 * @param profileName - What the profile judging it is called, where there is one.
 * @returns It as shown.
 */
const showMediaRequest = (
  record: MediaRequestRecord,
  items: readonly RequestItemRecord[],
  profileName: string | null = null,
): MediaRequest => ({
  id: record.id,
  kind: record.kind,
  tmdbId: record.tmdbId,
  musicBrainzId: record.musicBrainzId,
  title: record.title,
  artistName: record.artistName,
  year: record.year,
  overview: record.overview,
  posterUrl: record.posterUrl,
  libraryId: record.libraryId,
  profileId: record.profileId,
  profileName,
  isPickedByHand: record.isPickedByHand,
  ...describeRequestState(record, items),
  approval: record.approval,
  refusedBecause: record.refusedBecause,
  requestedBy: { id: record.requestedById, name: record.requestedByName },
  seasons: record.seasons,
  releaseTypes: record.releaseTypes,
  releaseDate:
    record.kind === 'film' || record.kind === 'album'
      ? (items.find((item) => item.season === null)?.airDate ?? null)
      : null,
  items: items
    .toSorted(
      (left, right) =>
        (left.season ?? 0) - (right.season ?? 0) ||
        (left.episode ?? 0) - (right.episode ?? 0) ||
        (left.airDate ?? '').localeCompare(right.airDate ?? ''),
    )
    .map((item) => ({
      id: item.id,
      musicBrainzId: item.musicBrainzId,
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
