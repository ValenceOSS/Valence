import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToCollection,
  collectionArtworkUrl,
  createCollection,
  dropCollectionArtwork,
  dropFromCollection,
  fetchCollection,
  fetchCollections,
  moveInCollection,
  removeCollection,
  saveCollectionArtwork,
  updateCollection,
} from './fetchCollections';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });
};

const SUMMARY = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 0,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCollections', () => {
  it('reads every collection, and only those holding a title where asked', async () => {
    answerWith({ collections: [SUMMARY] });

    await expect(fetchCollections()).resolves.toEqual([SUMMARY]);
    await fetchCollections({ containing: { seriesId: 's' }, withEmpty: true });
    await fetchCollections({ containing: { mediaItemId: 'm' } });

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/collections',
      '/api/collections?seriesId=s&withEmpty=true',
      '/api/collections?mediaId=m',
    ]);
  });

  it('reads one collection with its entries', async () => {
    answerWith({ collection: SUMMARY, entries: [] });

    await expect(fetchCollection(SUMMARY.id)).resolves.toEqual({
      collection: SUMMARY,
      entries: [],
    });
  });

  it('makes a collection and reads it back', async () => {
    answerWith(SUMMARY);

    await expect(createCollection({ name: 'Saga' })).resolves.toEqual(SUMMARY);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/collections',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Saga' }) }),
    );
  });

  it('makes nothing where the server refuses', async () => {
    answerWith({ error: 'Only administrators can do that.' }, false);

    await expect(createCollection({ name: 'x' })).resolves.toBeNull();
  });

  it('changes a collection with a patch, and deletes one', async () => {
    answerWith(SUMMARY);

    await expect(updateCollection('c', { isOrdered: false })).resolves.toBe(true);
    await expect(removeCollection('c')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/collections/c',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('adds, moves and takes out entries', async () => {
    answerWith({ added: 1 });

    await addToCollection('c', [{ seriesId: 's' }]);
    await moveInCollection('c', 'e', null);
    await expect(dropFromCollection('c', 'e')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/collections/c/entries',
      expect.objectContaining({ body: JSON.stringify({ entries: [{ seriesId: 's' }] }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/collections/c/entries/e',
      expect.objectContaining({ body: JSON.stringify({ afterEntryId: null }) }),
    );
  });

  it('says a change did not take where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(removeCollection('c')).resolves.toBe(false);
  });

  it('reads artwork of its own, versioned by when it changed', () => {
    expect(collectionArtworkUrl(SUMMARY)).toBeNull();
    expect(collectionArtworkUrl({ ...SUMMARY, hasOwnArtwork: true })).toBe(
      `/api/collections/${SUMMARY.id}/artwork?v=${encodeURIComponent(SUMMARY.updatedAt)}`,
    );
  });

  it('sends artwork as it is, and passes on why it was refused', async () => {
    answerWith({});
    const picture = new Blob(['x'], { type: 'image/png' });

    await expect(saveCollectionArtwork(SUMMARY.id, picture)).resolves.toBeNull();

    answerWith({ error: 'That picture is too large.' }, false);

    await expect(saveCollectionArtwork(SUMMARY.id, picture)).resolves.toBe(
      'That picture is too large.',
    );
  });

  it('says artwork could not be sent when the request never arrives', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(saveCollectionArtwork(SUMMARY.id, new Blob(['x']))).resolves.toBe(
      'Couldn’t upload that picture.',
    );
  });

  it('takes artwork away again', async () => {
    answerWith({});

    await expect(dropCollectionArtwork(SUMMARY.id)).resolves.toBe(true);
  });
});
