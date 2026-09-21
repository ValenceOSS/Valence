import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadMedia } from './uploadMedia';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const FILE = new File(['a film'], 'Arrival.mkv');

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 201,
    json: () => Promise.resolve({ path: 'Arrival/Arrival.mkv', bytes: 6 }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadMedia', () => {
  it('sends the file itself as the body, to the library, with where it goes in the address', async () => {
    await uploadMedia('lib-1', 'Arrival & Co/Arrival.mkv', FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/libraries/lib-1/uploads?path=Arrival+%26+Co%2FArrival.mkv',
      { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: FILE },
    );
  });

  it('says where it was put and how much arrived', async () => {
    await expect(uploadMedia('lib-1', 'Arrival/Arrival.mkv', FILE)).resolves.toEqual({
      path: 'Arrival/Arrival.mkv',
      bytes: 6,
    });
  });

  it('says what the server said when it would not take it', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'That disk is read-only to Valence.' }),
    });

    await expect(uploadMedia('lib-1', 'a.mkv', FILE)).rejects.toThrow(
      'That disk is read-only to Valence.',
    );
  });

  it('still says something when the server answered with no words', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(uploadMedia('lib-1', 'a.mkv', FILE)).rejects.toThrow(
      'The file could not be uploaded.',
    );
  });
});
