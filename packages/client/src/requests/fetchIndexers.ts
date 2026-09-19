import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import {
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
} from '@ValenceContracts/schemas/Indexer';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerTest,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';

const INDEXERS = '/api/admin/requests/indexers';

/**
 * Reads the indexers requesting searches, without their keys.
 *
 * @returns The indexers, in the order they are asked.
 */
const fetchIndexers = (): Promise<Indexer[]> => readFromServer(INDEXERS, z.array(IndexerSchema));

/**
 * Keeps a new indexer.
 *
 * @param draft - The indexer.
 * @returns It as kept, or why not.
 */
const addIndexer = (draft: IndexerDraft): Promise<Sent<Indexer>> =>
  sendToRequests(INDEXERS, 'POST', draft, async (response) =>
    IndexerSchema.parse(await response.json()),
  );

/**
 * Changes a kept indexer.
 *
 * @param id - Which.
 * @param change - What to change. A key left out is kept as it is.
 * @returns It as changed, or why not.
 */
const changeIndexer = (id: string, change: IndexerChange): Promise<Sent<Indexer>> =>
  sendToRequests(`${INDEXERS}/${id}`, 'PATCH', change, async (response) =>
    IndexerSchema.parse(await response.json()),
  );

/**
 * Forgets an indexer.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeIndexer = async (id: string): Promise<Refusal> =>
  (await sendToRequests(`${INDEXERS}/${id}`, 'DELETE', undefined, () => Promise.resolve(null)))
    .refusal;

/**
 * Asks a kept indexer whether it answers, reading what it can search again.
 *
 * @param id - Which.
 * @returns Whether it answered, or why the question was refused.
 */
const testIndexer = (id: string): Promise<Sent<IndexerTest>> =>
  sendToRequests(`${INDEXERS}/${id}/test`, 'POST', undefined, async (response) =>
    IndexerTestSchema.parse(await response.json()),
  );

/**
 * Asks an indexer that is not kept yet, or a change to one that is, whether it answers.
 *
 * @param draft - The indexer as it stands in the form.
 * @param id - The kept indexer it changes, whose key is used where the form gives none.
 * @returns Whether it answered, or why the question was refused.
 */
const tryIndexer = (draft: IndexerDraft, id?: string): Promise<Sent<IndexerTest>> =>
  sendToRequests(
    id === undefined ? `${INDEXERS}/try` : `${INDEXERS}/${id}/try`,
    'POST',
    draft,
    async (response) => IndexerTestSchema.parse(await response.json()),
  );

/**
 * Searches every enabled indexer at once.
 *
 * @param search - What to look for.
 * @returns What they found, and what each said.
 * @throws RequestFailed where the search was refused or the service could not be heard.
 */
const searchReleases = async (search: ReleaseSearch): Promise<ReleaseSearchOutcome> => {
  const path = '/api/admin/requests/search';
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(search),
  });

  if (!response.ok) {
    throw new RequestFailed(path, response.status);
  }

  return ReleaseSearchOutcomeSchema.parse(await response.json());
};

type SavedRelease = { kind: 'magnet'; url: string } | { kind: 'file'; file: Blob; name: string };

/**
 * Fetches a release through the server, with whatever the site needs to hand it over — which, for
 * a private site, is the session Valence keeps for it.
 *
 * @param indexerId - The indexer that found it.
 * @param url - Its download link.
 * @returns The torrent or NZB to save, or the magnet link it turned out to be, or why not.
 */
const fetchRelease = (indexerId: string, url: string): Promise<Sent<SavedRelease>> =>
  sendToRequests(
    `${INDEXERS}/${indexerId}/download`,
    'POST',
    { url },
    async (response): Promise<SavedRelease> => {
      if ((response.headers.get('content-type') ?? '').includes('json')) {
        return {
          kind: 'magnet',
          url: z.object({ magnet: z.string() }).parse(await response.json()).magnet,
        };
      }

      const name =
        /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ??
        'release.torrent';

      return { kind: 'file', file: await response.blob(), name };
    },
  );

export type { SavedRelease };

export {
  fetchRelease,
  addIndexer,
  changeIndexer,
  fetchIndexers,
  removeIndexer,
  searchReleases,
  testIndexer,
  tryIndexer,
};
