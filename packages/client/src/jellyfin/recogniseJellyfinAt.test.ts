import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { jellyfinLinks } from './jellyfinLinks';
import { recogniseJellyfinAt } from './recogniseJellyfinAt';
import { aFakeJellyfin } from './testing/aFakeJellyfin';
import { aFakeStore } from './testing/aFakeStore';

describe('recogniseJellyfinAt', () => {
  beforeEach(() => {
    installPlatform(aFakePlatform({ store: aFakeStore() }));
  });

  it('remembers a Jellyfin server where one answers', async () => {
    const jellyfin = aFakeJellyfin();

    expect(await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url))).toBe(true);
    expect(jellyfinLinks(platformInUse().store).of(jellyfin.address)?.serverName).toBe('Den');
  });

  it('keeps whoever was signed in when the same server answers again', async () => {
    const jellyfin = aFakeJellyfin();
    const links = jellyfinLinks(platformInUse().store);

    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));
    links.keep({
      ...(links.of(jellyfin.address) ?? {
        address: '',
        serverId: '',
        serverName: '',
        userId: null,
        userName: null,
        isAdministrator: false,
      }),
      token: 'kept',
    });
    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));

    expect(links.of(jellyfin.address)?.token).toBe('kept');
  });

  it('forgets an address where no Jellyfin answers any more', async () => {
    const jellyfin = aFakeJellyfin();

    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));

    expect(
      await recogniseJellyfinAt(jellyfin.address, () =>
        Promise.resolve(new Response(null, { status: 404 })),
      ),
    ).toBe(false);
    expect(jellyfinLinks(platformInUse().store).of(jellyfin.address)).toBeNull();
  });
});
