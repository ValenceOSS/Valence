import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thePhonesMusicPlayer } from './thePhonesMusicPlayer';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('thePhonesMusicPlayer', () => {
  it('is one player for the whole phone', () => {
    expect(thePhonesMusicPlayer()).toBe(thePhonesMusicPlayer());
  });

  it('starts with nothing playing', () => {
    expect(thePhonesMusicPlayer().read().current).toBeNull();
  });
});
