import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { redeemSetupLink } from './redeemSetupLink';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('redeemSetupLink', () => {
  it('sends what was chosen and says whether they are signed in', async () => {
    fetchMock.mockResolvedValue(Response.json({ isSignedIn: true }));

    await expect(
      redeemSetupLink('abc', { username: 'ada', password: 'a-long-enough-password' }),
    ).resolves.toEqual({ kind: 'answered', value: { isSignedIn: true } });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe('/api/setup-links/abc');
    expect(init?.body).toBe('{"username":"ada","password":"a-long-enough-password"}');
  });

  it('passes on why it was refused', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'That username is already in use.' }, { status: 400 }),
    );

    await expect(redeemSetupLink('abc', { username: 'sam' })).resolves.toEqual({
      kind: 'refused',
      refusal: { message: 'That username is already in use.' },
    });
  });
});
