import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ItemDraft } from '@ValenceRequests/mediaRequests/syncItems';

/**
 * A film or episode as a request first waits for it: not out yet, and nothing searched for.
 *
 * @param draft - Which film or episode.
 * @param id - Its id.
 * @param requestId - The request it belongs to.
 * @param at - The moment it is made.
 * @returns The film or episode.
 */
const itemFromDraft = (
  draft: ItemDraft,
  id: string,
  requestId: string,
  at: string,
): RequestItemRecord => ({
  ...draft,
  id,
  requestId,
  state: 'waiting',
  problem: null,
  releaseTitle: null,
  indexerId: null,
  downloadId: null,
  filePath: null,
  score: null,
  filedTitle: null,
  filedScore: null,
  attempts: 0,
  lastSearchedAt: null,
  updatedAt: at,
});

export { itemFromDraft };
