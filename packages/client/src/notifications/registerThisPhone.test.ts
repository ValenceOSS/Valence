import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerThisPhone } from '@ValenceClient/notifications/registerThisPhone';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerThisPhone', () => {
  it('sends the phone’s token to the server', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    const phone = {
      platform: 'apple' as const,
      token: 'a'.repeat(64),
      environment: 'sandbox' as const,
    };

    vi.stubGlobal('fetch', fetchMock);

    expect(await registerThisPhone(phone)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/phones', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(phone),
    });
  });

  it('says so where the server cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));

    expect(
      await registerThisPhone({
        platform: 'apple',
        token: 'a'.repeat(64),
        environment: 'production',
      }),
    ).toBe(false);
  });
});
