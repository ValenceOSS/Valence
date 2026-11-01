import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signOutSession } from './fetchAccountSessions';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signOutSession', () => {
  it('signs out the device behind the session an admin picked', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(signOutSession('tab-1')).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/sessions/tab-1/sign-out',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('says why the server refused, in its own words', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Only the owner can do that.' }), { status: 403 }),
    );

    await expect(signOutSession('tab-1')).resolves.toStrictEqual({
      message: 'Only the owner can do that.',
    });
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(signOutSession('tab-1')).resolves.toStrictEqual({
      message: 'Couldn’t reach the server.',
    });
  });
});
