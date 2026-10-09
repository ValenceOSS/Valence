import { highestSeasonOf } from '@ValenceRequests/mediaRequests/highestSeasonOf';
import { requestFactsOf } from '@ValenceRequests/mediaRequests/requestFactsOf';
import { seasonsChosen } from '@ValenceRequests/mediaRequests/seasonsChosen';
import type { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { z } from 'zod';

/**
 * A request as it is first kept, from what was asked: approved or waiting on approval as the asker
 * may be, with the facts the catalogue gave, and with the connected app it is handed to where its
 * library hands requests off. Only a series keeps the seasons asked for, whether it follows new ones
 * and the last season there was to tell them by, and the folders the library already keeps it in;
 * and only an artist the kinds of release, albums alone where none were named.
 *
 * @param draft - What was asked, read.
 * @param id - Its id.
 * @param at - The moment it is made.
 * @returns The request.
 */
const recordFromDraft = (
  draft: z.infer<typeof MediaRequestDraftSchema>,
  id: string,
  at: string,
): MediaRequestRecord => ({
  id,
  kind: draft.kind,
  tmdbId: draft.tmdbId,
  musicBrainzId: draft.musicBrainzId,
  openLibraryId: draft.openLibraryId,
  ...requestFactsOf(draft.catalogue),
  libraryId: draft.libraryId,
  libraryPath: draft.libraryPath,
  libraryFolder: draft.kind === 'series' ? (draft.held?.folder ?? null) : null,
  seasonFolders: draft.kind === 'series' ? (draft.held?.seasonFolders ?? []) : [],
  libraryLanguage: draft.libraryLanguage ?? null,
  profileId: draft.profileId,
  isPickedByHand: draft.isPickedByHand,
  approval: draft.isApproved ? 'approved' : 'awaiting',
  refusedBecause: null,
  requestedById: draft.requestedBy.id,
  requestedByName: draft.requestedBy.name,
  alsoAskedBy: [],
  profileAsk: null,
  seasons:
    draft.kind === 'series'
      ? seasonsChosen(draft.seasons, draft.followsNewSeasons, draft.catalogue.episodes)
      : null,
  followsNewSeasons: draft.kind === 'series' && draft.followsNewSeasons,
  followsAfter: draft.kind === 'series' ? highestSeasonOf(draft.catalogue.episodes) : null,
  releaseTypes: draft.kind === 'artist' ? (draft.releaseTypes ?? ['album']) : null,
  mediaId: draft.kind === 'series' ? (draft.held?.mediaId ?? null) : null,
  problem: null,
  problemCode: null,
  catalogueCheckedAt: at,
  tvdbId: draft.catalogue.tvdbId ?? null,
  imdbId: draft.catalogue.imdbId ?? null,
  handOff: draft.handOff,
  handOffId: null,
  createdAt: at,
  updatedAt: at,
});

export { recordFromDraft };
