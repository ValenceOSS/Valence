import { describe, expect, it } from 'vitest';
import { aJellyfinServer } from './testing/aJellyfinServer';

describe('createJellyfinApp', () => {
  it('answers each request for the app that sent it, as the session its token stands for', async () => {
    const { ask } = aJellyfinServer();

    expect((await ask('/Users/Me')).status).toBe(200);
    expect((await ask('/Users/Me', { token: null })).status).toBe(401);
  });

  it('answers an address it does not know with nothing', async () => {
    const { ask } = aJellyfinServer();

    expect((await ask('/LiveTv/Channels')).status).toBe(404);
  });
});
