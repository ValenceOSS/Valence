import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isUsernameAvailable } from './isUsernameAvailable';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isUsernameAvailable', () => {
  it('asks about a username for an account', async () => {
    fetchMock.mockResolvedValue(Response.json({ isAvailable: true }));

    await expect(isUsernameAvailable('ada', 'usr-1')).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/admin/accounts/username-available?username=ada&userId=usr-1',
    );
  });

  it('says it is taken', async () => {
    fetchMock.mockResolvedValue(Response.json({ isAvailable: false }));

    await expect(isUsernameAvailable('ada')).resolves.toBe(false);
  });

  it('cannot say when the server does not answer', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    await expect(isUsernameAvailable('ada')).resolves.toBeNull();
  });
});
