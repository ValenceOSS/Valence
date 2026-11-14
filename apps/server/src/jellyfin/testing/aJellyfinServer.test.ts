import { describe, expect, it } from 'vitest';
import { aJellyfinServer } from './aJellyfinServer';

describe('aJellyfinServer', () => {
  it('asks the Jellyfin endpoints signed in, or not where told', async () => {
    const { ask } = aJellyfinServer();

    expect((await ask('/Users/Me')).status).toBe(200);
    expect((await ask('/Users/Me', { token: null })).status).toBe(401);
  });
});
