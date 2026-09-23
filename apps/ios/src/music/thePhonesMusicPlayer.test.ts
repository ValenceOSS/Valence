import { thePhonesMusicPlayer } from './thePhonesMusicPlayer';

describe('thePhonesMusicPlayer', () => {
  it('is one player for the whole phone', () => {
    expect(thePhonesMusicPlayer()).toBe(thePhonesMusicPlayer());
  });

  it('starts with nothing playing', () => {
    expect(thePhonesMusicPlayer().read().current).toBeNull();
  });
});
