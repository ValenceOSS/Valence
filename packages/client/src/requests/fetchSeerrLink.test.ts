import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSeerrLink } from './fetchSeerrLink';

const LINK = {
  isEnabled: true,
  apiKey: '0123456789abcdef0123456789abcdef',
  accountId: 'a1',
  isRequestingOn: true,
  radarrPath: '/arr/radarr',
  sonarrPath: '/arr/sonarr',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSeerrLink', () => {
  it('reads the link', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(LINK)));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchSeerrLink()).resolves.toEqual(LINK);
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/requests/seerr');
  });

  it('throws where it may not be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(fetchSeerrLink()).rejects.toThrow();
  });
});
