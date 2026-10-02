import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emailSetupLink } from './emailSetupLink';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const LINK = { url: 'http://valence.local/welcome/abc', expiresAt: '2026-10-09T00:00:00.000Z' };

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(Response.json(LINK));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('emailSetupLink', () => {
  it('sends the link on screen by its token', async () => {
    await expect(emailSetupLink('usr-1', { held: LINK })).resolves.toEqual({
      kind: 'answered',
      value: LINK,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe('/api/admin/accounts/usr-1/setup-link/email');
    expect(init?.body).toBe('{"token":"abc"}');
  });

  it('asks for a new link when there is none on screen', async () => {
    await emailSetupLink('usr-1', { lifetimeDays: 1 });

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe('{"lifetimeDays":1}');
  });
});
