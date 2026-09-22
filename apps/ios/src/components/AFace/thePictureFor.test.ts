import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thePictureFor } from './thePictureFor';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const aProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'photo', isVideo: false },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-09-22T10:00:00.000Z',
  ...overrides,
});

afterEach(() => {
  forgetPlatform();
});

describe('thePictureFor', () => {
  it('gives the whole address, since the system fetches an image itself', () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    expect(thePictureFor(aProfile()).startsWith('http://192.168.1.36:8420/api/profiles/')).toBe(
      true,
    );
  });

  it('carries the time the face changed, so a new picture is not read from the cache', () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    expect(thePictureFor(aProfile())).toContain('v=2026-09-22T10');
  });

  it('manages on a client that is served by its own valence', () => {
    installPlatform(aFakePlatform());

    expect(thePictureFor(aProfile()).startsWith('/api/profiles/')).toBe(true);
  });
});
