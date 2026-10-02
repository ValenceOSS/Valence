import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { giveFirstPassword } from './giveFirstPassword';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('giveFirstPassword', () => {
  it('sets the password', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(giveFirstPassword('a-long-enough-password')).resolves.toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/setup-links/password');
  });

  it('passes on a refusal', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'This account already has a password.' }, { status: 400 }),
    );

    await expect(giveFirstPassword('a-long-enough-password')).resolves.toEqual({
      message: 'This account already has a password.',
    });
  });
});
