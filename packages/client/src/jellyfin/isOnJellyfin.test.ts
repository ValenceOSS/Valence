import { describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { isOnJellyfin } from './isOnJellyfin';
import { recogniseJellyfinAt } from './recogniseJellyfinAt';
import { aFakeJellyfin } from './testing/aFakeJellyfin';
import { aFakeStore } from './testing/aFakeStore';

describe('isOnJellyfin', () => {
  it('says whether the server the app is pointed at is a Jellyfin one', async () => {
    const jellyfin = aFakeJellyfin();

    installPlatform(aFakePlatform({ store: aFakeStore(), serverAddress: () => jellyfin.address }));

    expect(isOnJellyfin()).toBe(false);

    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));

    expect(isOnJellyfin()).toBe(true);
  });
});
