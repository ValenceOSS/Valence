import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import {
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
} from '@ValenceContracts/schemas/Indexer';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerTest,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';

const INDEXERS = '/api/admin/requests/indexers';

const UNREACHABLE: Refusal = { message: 'The server could not be reached.' };

type Sent<Value> = { value: Value | null; refusal: Refusal };

/**
 * Sends something to the indexer routes, and reads the answer or why it was refused.
 *
 * @param path - Where to send it.
 * @param method - How.
 * @param body - What to send, where anything.
 * @param read - How to read a good answer.
 * @returns The answer, or the refusal.
 */
const send = async <Value>(
  path: string,
  method: string,
  body: object | undefined,
  read: (response: Response) => Promise<Value>,
): Promise<Sent<Value>> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  if (response === null) {
    return { value: null, refusal: UNREACHABLE };
  }

  const refusal = await readRefusal(response);

  return refusal === null
    ? { value: await read(response), refusal: null }
    : { value: null, refusal };
};

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
  send(INDEXERS, 'POST', draft, async (response) => IndexerSchema.parse(await response.json()));

/**
 * Changes a kept indexer.
 *
 * @param id - Which.
 * @param change - What to change. A key left out is kept as it is.
 * @returns It as changed, or why not.
 */
const changeIndexer = (id: string, change: IndexerChange): Promise<Sent<Indexer>> =>
  send(`${INDEXERS}/${id}`, 'PATCH', change, async (response) =>
    IndexerSchema.parse(await response.json()),
  );

/**
 * Forgets an indexer.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeIndexer = async (id: string): Promise<Refusal> =>
  (await send(`${INDEXERS}/${id}`, 'DELETE', undefined, () => Promise.resolve(null))).refusal;

/**
 * Asks a kept indexer whether it answers, reading what it can search again.
 *
 * @param id - Which.
 * @returns Whether it answered, or why the question was refused.
 */
const testIndexer = (id: string): Promise<Sent<IndexerTest>> =>
  send(`${INDEXERS}/${id}/test`, 'POST', undefined, async (response) =>
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
  send(
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
const fetchRelease = async (indexerId: string, url: string): Promise<Sent<SavedRelease>> => {
  const response = await fetch(`${INDEXERS}/${indexerId}/download`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => null);

  if (response === null) {
    return { value: null, refusal: UNREACHABLE };
  }

  const refusal = await readRefusal(response);

  if (refusal !== null) {
    return { value: null, refusal };
  }

  if ((response.headers.get('content-type') ?? '').includes('json')) {
    return {
      value: {
        kind: 'magnet',
        url: z.object({ magnet: z.string() }).parse(await response.json()).magnet,
      },
      refusal: null,
    };
  }

  const name =
    /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ??
    'release.torrent';

  return { value: { kind: 'file', file: await response.blob(), name }, refusal: null };
};

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
