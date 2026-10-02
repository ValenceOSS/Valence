import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { createPlexTvCaller } from './createPlexTvCaller';

describe('createPlexTvCaller', () => {
  it('reads plex.tv as the owner', async () => {
    const { fetch, calls } = aFakeSourceFetch(() => ({ body: '<user/>' }));

    await createPlexTvCaller(fetch, 'owner', 'client').text('/api/v2/user');

    expect(calls[0]?.url.toString()).toBe('https://plex.tv/api/v2/user');
    expect(calls[0]?.headers['X-Plex-Token']).toBe('owner');
  });
});
