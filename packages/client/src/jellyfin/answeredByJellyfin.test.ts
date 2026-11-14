import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { answeredByJellyfin } from './answeredByJellyfin';
import { recogniseJellyfinAt } from './recogniseJellyfinAt';
import { aFakeJellyfin } from './testing/aFakeJellyfin';
import { aFakeStore } from './testing/aFakeStore';

describe('answeredByJellyfin', () => {
  beforeEach(() => {
    installPlatform(aFakePlatform({ store: aFakeStore() }));
  });

  it('answers Valence’s endpoints for a Jellyfin server the app is pointed at', async () => {
    const jellyfin = aFakeJellyfin();

    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));

    const answer = answeredByJellyfin(
      jellyfin.address,
      new Request(`${jellyfin.address}/api/about`),
      jellyfin.send,
    );

    expect(answer).not.toBeNull();
    expect(await answer?.then((one) => one.text())).toContain('"features"');
  });

  it('leaves a Valence server, and anything not one of Valence’s endpoints, to the server', async () => {
    const jellyfin = aFakeJellyfin();

    expect(
      answeredByJellyfin(
        'http://valence.test',
        new Request('http://valence.test/api/about'),
        jellyfin.send,
      ),
    ).toBeNull();

    await recogniseJellyfinAt(jellyfin.address, (url) => jellyfin.send(url));

    expect(
      answeredByJellyfin(
        jellyfin.address,
        new Request(`${jellyfin.address}/Items/x/Images/Primary`),
        jellyfin.send,
      ),
    ).toBeNull();
    expect(
      answeredByJellyfin(null, new Request('http://x.test/api/about'), jellyfin.send),
    ).toBeNull();
  });
});
