import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { aFakeSpeaker } from '@ValencePhone/testing/aFakeSpeaker';
import { thePhonesMusicPlayer } from './thePhonesMusicPlayer';

const mockSpeaker = aFakeSpeaker();

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => mockSpeaker.speaker,
}));

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

  it('puts the song on the lock screen, as the whole of what plays', () => {
    thePhonesMusicPlayer().play([aTrack(1)], 0);

    expect(mockSpeaker.speaker.describe).toHaveBeenCalledWith(
      'music',
      expect.objectContaining({ title: 'Track 1', from: null, lasts: null }),
    );
  });

  it('answers the lock screen’s buttons for the music, and leaves a book’s alone', () => {
    const player = thePhonesMusicPlayer();
    const toggle = jest.spyOn(player, 'toggle');

    mockSpeaker.press({ channel: 'book', command: 'toggle' });

    expect(toggle).not.toHaveBeenCalled();

    mockSpeaker.press({ channel: 'music', command: 'toggle' });

    expect(toggle).toHaveBeenCalledTimes(1);
  });
});
