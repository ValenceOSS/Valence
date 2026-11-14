import { describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theJellyfinAnswers } from './theJellyfinAnswers';
import { aFakeJellyfin } from './testing/aFakeJellyfin';
import { aFakeStore } from './testing/aFakeStore';

describe('theJellyfinAnswers', () => {
  it('signs in to Jellyfin as this device, once, from the device’s own store', async () => {
    const jellyfin = aFakeJellyfin();

    installPlatform(
      aFakePlatform({ store: aFakeStore(), describeThisDevice: () => ({ name: 'Living room' }) }),
    );

    const made = theJellyfinAnswers(jellyfin.send);
    const link = {
      address: jellyfin.address,
      serverId: 's',
      serverName: 'Den',
      token: null,
      userId: null,
      userName: null,
      isAdministrator: false,
    };

    made.links.keep(link);
    await made.answers.answer(
      link,
      new Request(`${jellyfin.address}/api/auth/sign-in/username`, {
        method: 'POST',
        body: JSON.stringify({ username: 'marnie', password: 'right' }),
      }),
    );

    expect(jellyfin.asked.at(-1)?.authorization).toContain(
      'Client="Valence", Device="Living%20room"',
    );
    expect(theJellyfinAnswers(jellyfin.send)).toBe(made);
  });
});
