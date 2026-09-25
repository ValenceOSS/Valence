import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { onThisServer } from './onThisServer';

afterEach(() => {
  forgetPlatform();
});

describe('onThisServer', () => {
  it('puts a path on the server this phone watches', () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    expect(onThisServer('/api/media/one/image/poster')).toBe(
      'http://192.168.1.36:8420/api/media/one/image/poster',
    );
  });

  it('leaves the path alone on a client served by its own valence', () => {
    installPlatform(aFakePlatform());

    expect(onThisServer('/api/media/one/image/poster')).toBe('/api/media/one/image/poster');
  });
});
