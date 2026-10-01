import { afterEach, describe, expect, it, vi } from 'vitest';
import { rotateSeerrKey } from './rotateSeerrKey';

const LINK = {
  isEnabled: true,
  apiKey: 'fedcba9876543210fedcba9876543210',
  accountId: 'a1',
  isRequestingOn: true,
  radarrPath: '/arr/radarr',
  sonarrPath: '/arr/sonarr',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('rotateSeerrKey', () => {
  it('asks for a new key and reads it back', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(LINK)));

    vi.stubGlobal('fetch', fetching);

    expect((await rotateSeerrKey()).value?.apiKey).toBe(LINK.apiKey);
    expect(fetching).toHaveBeenCalledWith(
      '/api/requests/seerr/key',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('says the server could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect((await rotateSeerrKey()).value).toBeNull();
  });
});
