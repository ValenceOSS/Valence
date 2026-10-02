import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { createSourceReader } from './createSourceReader';
import { readFixture } from './readFixture';

describe('createSourceReader', () => {
  it('sends each kind of server its key the way it expects', async () => {
    const jellyfin = aFakeSourceFetch(() => ({ body: readFixture('jellyfin-public-info.json') }));
    const emby = aFakeSourceFetch(() => ({ body: readFixture('emby-public-info.json') }));
    const plex = aFakeSourceFetch(({ url }) => ({
      body: readFixture(url.pathname === '/identity' ? 'plex-identity.json' : 'plex-root.json'),
    }));

    await createSourceReader(
      { kind: 'jellyfin', url: 'http://j', token: 'k', clientId: 'c' },
      jellyfin.fetch,
      [],
    ).identify();
    await createSourceReader(
      { kind: 'emby', url: 'http://e', token: 'k', clientId: 'c' },
      emby.fetch,
      [],
    ).identify();
    await createSourceReader(
      { kind: 'plex', url: 'http://p', token: 'k', clientId: 'c' },
      plex.fetch,
      [],
    ).identify();

    expect(jellyfin.calls[0]?.headers.Authorization).toBe(
      'MediaBrowser Client="Valence", Device="Valence", DeviceId="c", Version="1", Token="k"',
    );
    expect(emby.calls[0]?.url.pathname).toBe('/emby/System/Info/Public');
    expect(emby.calls[0]?.headers['X-Emby-Token']).toBe('k');
    expect(plex.calls[0]?.headers['X-Plex-Token']).toBe('k');
  });
});
