import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetWatchedTitle } from './forgetWatchedTitle';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forgetWatchedTitle', () => {
  it('asks the server to forget the title, and says how much went', async () => {
    fetchMock.mockResolvedValue(Response.json({ forgotten: 4 }));

    await expect(forgetWatchedTitle('episode-1')).resolves.toBe(4);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/history/titles/episode-1');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });

  it('throws where the server refuses', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'no' }, { status: 401 }));

    await expect(forgetWatchedTitle('episode-1')).rejects.toThrow();
  });
});
