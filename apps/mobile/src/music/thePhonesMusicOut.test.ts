import { Platform } from 'react-native';
import { thePhonesMusicOut } from './thePhonesMusicOut';

describe('thePhonesMusicOut', () => {
  it('plays through the speaker everything but Ogg', () => {
    const out = thePhonesMusicOut();

    expect(out.canPlay('audio/flac')).toBe(true);
    expect(out.canPlay('audio/ogg; codecs=opus')).toBe(false);
    expect(typeof out.audio.play).toBe('function');
  });

  it('plays Ogg as it is on Android', () => {
    const was = Platform.OS;

    Platform.OS = 'android';

    expect(thePhonesMusicOut().canPlay('audio/ogg; codecs=opus')).toBe(true);

    Platform.OS = was;
  });

  it('says so in a build that cannot play music', () => {
    expect(() => thePhonesMusicOut(null)).toThrow('This build of Valence cannot play music.');
  });
});
