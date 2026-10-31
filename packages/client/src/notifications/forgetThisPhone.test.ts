import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetThisPhone } from '@ValenceClient/notifications/forgetThisPhone';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forgetThisPhone', () => {
  it('asks the server to stop waking the phone', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    vi.stubGlobal('fetch', fetchMock);

    expect(await forgetThisPhone('token')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/phones', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'token' }),
    });
  });
});
