import { Platform } from 'react-native';
import { canThisPhonePlay } from './canThisPhonePlay';

describe('canThisPhonePlay', () => {
  it('plays everything but Ogg on an iPhone', () => {
    expect(canThisPhonePlay('audio/flac')).toBe(true);
    expect(canThisPhonePlay('audio/ogg; codecs=opus')).toBe(false);
  });

  it('plays Ogg on Android', () => {
    const was = Platform.OS;

    Platform.OS = 'android';

    expect(canThisPhonePlay('audio/ogg; codecs=opus')).toBe(true);

    Platform.OS = was;
  });
});
