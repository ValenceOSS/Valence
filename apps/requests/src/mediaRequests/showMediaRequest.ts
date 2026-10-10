import { isAskingNarration } from '@ValenceContracts/functions/isAskingNarration';
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
  openLibraryId: record.openLibraryId,
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
  alsoAskedBy: record.alsoAskedBy,
  origin: record.origin,
  isFollowed: record.isFollowed,
  profileAsk: record.profileAsk,
  isHandedOff: record.handOff !== null,
  seasons: record.seasons,
  followsNewSeasons: record.followsNewSeasons,
  releaseTypes: record.releaseTypes,
  upgradesToLossless: record.upgradesToLossless ?? false,
  narrations: record.narrations ?? null,
  isAskingNarration: isAskingNarration(record),
  bookFormats: record.bookFormats ?? null,
  versions: record.versions ?? null,
  releaseDate:
    record.kind === 'film' || record.kind === 'album'
      ? (items.find((item) => item.season === null)?.airDate ?? null)
      : null,
  releaseDates: record.releaseDates,
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
      format: item.format ?? null,
      versionProfileId: item.versionProfileId ?? null,
      title: item.title,
      airDate: item.airDate,
      state: item.state,
      problem: item.problem,
      problemCode: item.problemCode,
      releaseTitle: item.releaseTitle,
      downloadId: item.downloadId,
      filePath: item.filePath,
      score: item.score,
      downloadedBytes: item.downloadedBytes,
      downloadSeconds: item.downloadSeconds,
      isFollowed: item.isFollowed,
      trackCount: item.trackCount ?? null,
      filedTrackCount: item.filedTrackCount ?? null,
      heldQuality: item.heldQuality ?? null,
      narration: item.narration ?? null,
      filedMinutes: item.filedMinutes ?? null,
      isPickedByHand: item.isPickedByHand,
      lastSearchedAt: item.lastSearchedAt,
      updatedAt: item.updatedAt,
    })),
  mediaId: record.mediaId,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export { showMediaRequest };
