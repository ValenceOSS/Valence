import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountsHere } from './accountsHere';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('accountsHere', () => {
  it('reads every account signed in on this browser', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify([
              { session: { token: 't1' }, user: { id: 'ada', name: 'Ada' } },
              { session: { token: 't2' }, user: { id: 'bo', name: 'Bo', email: 'bo@home' } },
            ]),
          ),
        ),
      ),
    );

    await expect(accountsHere()).resolves.toEqual([
      { token: 't1', accountId: 'ada', name: 'Ada' },
      { token: 't2', accountId: 'bo', name: 'Bo' },
    ]);
  });

  it('reads none where the server could not say', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
    );

    await expect(accountsHere()).resolves.toEqual([]);
  });
});
