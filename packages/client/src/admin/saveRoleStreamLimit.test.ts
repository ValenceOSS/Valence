import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveRoleStreamLimit } from './saveRoleStreamLimit';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveRoleStreamLimit', () => {
  it('sends the limit to the role’s address', async () => {
    const limit = { maxBitrateKbps: 4000, maxStreams: null };
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(limit))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(saveRoleStreamLimit('kids', limit)).resolves.toEqual(limit);
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/admin/roles/kids/stream-limit');
  });

  it('answers nothing where it could not be saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 403 }))),
    );

    await expect(
      saveRoleStreamLimit('kids', { maxBitrateKbps: null, maxStreams: null }),
    ).resolves.toBeNull();
  });
});
