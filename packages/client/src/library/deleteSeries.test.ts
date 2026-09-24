import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteSeries } from './deleteSeries';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ files: 3 }) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deleteSeries', () => {
  it('asks the server to delete the series', async () => {
    await deleteSeries('series-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/series/series-1', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });

  it('says how many files went', async () => {
    await expect(deleteSeries('series-1')).resolves.toBe(3);
  });

  it('says what the server said when it would not', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'That disk is read-only to Valence.' }),
    });

    await expect(deleteSeries('series-1')).rejects.toThrow('That disk is read-only to Valence.');
  });

  it('still says something when the server answered with no words', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(deleteSeries('series-1')).rejects.toThrow('The series could not be deleted.');
  });
});
