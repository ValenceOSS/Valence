import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMediaPaths } from './fetchMediaPaths';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ paths: { m1: '/media/films/Arrival.mkv' } }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMediaPaths', () => {
  it('asks where each item in one library is, and answers by the item', async () => {
    await expect(fetchMediaPaths('films')).resolves.toEqual({ m1: '/media/films/Arrival.mkv' });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/admin/files/media?libraryId=films');
  });
});
