import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSample } from './fetchSample';

const fetchMock = vi.fn<(input: string) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSample', () => {
  it('asks for a sample by artist and album, and says where it plays from', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ url: 'https://a.apple.com/p.m4a' })));

    await expect(fetchSample('Drake', 'Her Loss')).resolves.toBe('https://a.apple.com/p.m4a');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/requests/sample?artist=Drake&album=Her+Loss');
  });

  it('says nothing is offered where nothing is', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ url: null })));

    await expect(fetchSample('Drake', 'Views')).resolves.toBeNull();
  });
});
