import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteMedia } from './deleteMedia';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deleteMedia', () => {
  it('asks the server to delete the item', async () => {
    await deleteMedia('media-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/media/media-1', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });

  it('says what the server said when it would not', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'That disk is read-only to Valence.' }),
    });

    await expect(deleteMedia('media-1')).rejects.toThrow('That disk is read-only to Valence.');
  });

  it('still says something when the server answered with no words', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(deleteMedia('media-1')).rejects.toThrow('The file could not be deleted.');
  });
});
