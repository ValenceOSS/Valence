import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSetupLink } from './readSetupLink';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const DETAILS = {
  name: 'Ada',
  username: 'ada',
  suggestedUsername: 'ada',
  hasEmail: false,
  hasPassword: false,
  canResetPassword: false,
  expiresAt: '2026-10-09T00:00:00.000Z',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readSetupLink', () => {
  it('reads what is left to choose', async () => {
    fetchMock.mockResolvedValue(Response.json(DETAILS));

    await expect(readSetupLink('abc')).resolves.toEqual(DETAILS);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/setup-links/abc');
  });

  it('throws for a link that no longer works', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'Gone.' }, { status: 404 }));

    await expect(readSetupLink('abc')).rejects.toThrow();
  });
});
