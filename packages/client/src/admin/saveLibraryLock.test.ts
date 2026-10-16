import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveLibraryLock } from './saveLibraryLock';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveLibraryLock', () => {
  it('sends the lock to the library’s address', async () => {
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ hasLock: true }))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(saveLibraryLock('kids', { secret: '2468', relockMinutes: 30 })).resolves.toBe(
      true,
    );
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/admin/libraries/kids/lock');
  });

  it('says so where it could not be saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 400 }))),
    );

    await expect(saveLibraryLock('kids', { secret: null, relockMinutes: 60 })).resolves.toBe(false);
  });
});
