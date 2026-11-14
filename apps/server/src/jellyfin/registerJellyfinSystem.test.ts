import { describe, expect, it } from 'vitest';
import { aJellyfinServer } from './testing/aJellyfinServer';

describe('registerJellyfinSystem', () => {
  it('say who they are before anybody signs in', async () => {
    const { ask } = aJellyfinServer();
    const answer = await ask('/System/Info/Public', { token: null });

    expect(await answer.json()).toMatchObject({
      ProductName: 'Jellyfin Server',
      Version: '10.10.7',
      ServerName: 'Valence',
      LocalAddress: 'http://valence.test/jellyfin',
      StartupWizardCompleted: true,
    });
  });

  it('answer the other questions an app asks while a server is added', async () => {
    const { ask } = aJellyfinServer();

    expect(await (await ask('/Branding/Configuration', { token: null })).json()).toMatchObject({
      LoginDisclaimer: '',
    });
    expect(await (await ask('/Users/Public', { token: null })).json()).toEqual([]);
    expect(await (await ask('/QuickConnect/Enabled', { token: null })).json()).toBe(false);
    expect((await ask('/System/Info', { token: null })).status).toBe(401);
  });

  it('answer an address it does not know with nothing', async () => {
    const { ask } = aJellyfinServer();

    expect((await ask('/LiveTv/Channels')).status).toBe(404);
  });
});
