import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { issueSetupLink } from './issueSetupLink';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const LINK = { url: 'http://valence.local/welcome/abc', expiresAt: '2026-10-09T00:00:00.000Z' };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('issueSetupLink', () => {
  it('asks for a link lasting the days chosen', async () => {
    fetchMock.mockResolvedValue(Response.json(LINK, { status: 201 }));

    await expect(issueSetupLink('usr 1', 30)).resolves.toEqual({ kind: 'answered', value: LINK });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe('/api/admin/accounts/usr%201/setup-link');
    expect(init).toMatchObject({ method: 'POST', body: '{"lifetimeDays":30}' });
  });
});
