import { describe, expect, it } from 'vitest';
import { findJellyfinAt } from './findJellyfinAt';
import { aFakeJellyfin } from './testing/aFakeJellyfin';

describe('findJellyfinAt', () => {
  it('finds a Jellyfin server by what it says about itself', async () => {
    const jellyfin = aFakeJellyfin();

    expect(await findJellyfinAt(jellyfin.address, (url) => jellyfin.send(url))).toMatchObject({
      address: jellyfin.address,
      serverName: 'Den',
      token: null,
    });
  });

  it('finds nothing where something else answers', async () => {
    expect(
      await findJellyfinAt('http://x.test', () => Promise.resolve(new Response('<html>'))),
    ).toBeNull();
    expect(
      await findJellyfinAt('http://x.test', () =>
        Promise.resolve(new Response(JSON.stringify({ Id: 'a', ProductName: 'Emby Server' }))),
      ),
    ).toBeNull();
    expect(
      await findJellyfinAt('http://x.test', () => Promise.reject(new Error('down'))),
    ).toBeNull();
  });
});
