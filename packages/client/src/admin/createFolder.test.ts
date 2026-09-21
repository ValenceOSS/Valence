import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFolder } from './createFolder';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 201,
    json: () => Promise.resolve({ name: 'anime', path: '/media/anime' }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createFolder', () => {
  it('asks for the folder to be made inside the one given, as json', async () => {
    await createFolder('/media', 'anime');

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/media', name: 'anime' }),
    });
  });

  it('returns the folder that was made', async () => {
    await expect(createFolder('/media', 'anime')).resolves.toEqual({
      name: 'anime',
      path: '/media/anime',
    });
  });

  it('says what the server said when it would not, since that is what tells somebody what to do', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'That disk is read-only to Valence.' }),
    });

    await expect(createFolder('/media', 'anime')).rejects.toThrow(
      'That disk is read-only to Valence.',
    );
  });

  it('still says something when the server answered with no words', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(createFolder('/media', 'anime')).rejects.toThrow('The folder could not be made.');
  });
});
