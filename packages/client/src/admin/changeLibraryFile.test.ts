import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeLibraryFile } from './changeLibraryFile';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ path: '/media/films/Arrival (2016).mkv' }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeLibraryFile', () => {
  it('deletes by path', async () => {
    await changeLibraryFile('/media/films/Arrival.mkv', { kind: 'delete' });

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/files?path=%2Fmedia%2Ffilms%2FArrival.mkv', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });

  it('renames, and says where it is now', async () => {
    await expect(
      changeLibraryFile('/media/films/Arrival.mkv', { kind: 'rename', name: 'Arrival (2016).mkv' }),
    ).resolves.toBe('/media/films/Arrival (2016).mkv');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/files/rename');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      '{"path":"/media/films/Arrival.mkv","name":"Arrival (2016).mkv"}',
    );
  });

  it('moves into another folder', async () => {
    await changeLibraryFile('/media/films/Arrival.mkv', { kind: 'move', into: '/media/films/A' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/files/move');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      '{"path":"/media/films/Arrival.mkv","into":"/media/films/A"}',
    );
  });

  it('says what the server said where it would not', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Something of that name is already there.' }),
    });

    await expect(
      changeLibraryFile('/media/films/Arrival.mkv', { kind: 'rename', name: 'Dune.mkv' }),
    ).rejects.toThrow('Something of that name is already there.');
  });
});
