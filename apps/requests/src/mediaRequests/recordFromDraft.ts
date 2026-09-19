import { requestFactsOf } from '@ValenceRequests/mediaRequests/requestFactsOf';
import type { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { z } from 'zod';

/**
 * A request as it is first kept, from what was asked: approved or waiting on approval as the asker
 * may be, and with the facts the catalogue gave.
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
  ...requestFactsOf(draft.catalogue),
  libraryId: draft.libraryId,
  libraryPath: draft.libraryPath,
  profileId: draft.profileId,
  isPickedByHand: draft.isPickedByHand,
  approval: draft.isApproved ? 'approved' : 'awaiting',
  refusedBecause: null,
  requestedById: draft.requestedBy.id,
  requestedByName: draft.requestedBy.name,
  seasons: draft.kind === 'film' ? null : draft.seasons,
  waitFor: draft.waitFor,
  mediaId: null,
  problem: null,
  catalogueCheckedAt: at,
  createdAt: at,
  updatedAt: at,
});

export { recordFromDraft };
