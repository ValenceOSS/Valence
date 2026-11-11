import { describe, expect, it } from 'vitest';
import { soundOf } from './soundOf';

describe('soundOf', () => {
  it('says nothing where there is no soundtrack', () => {
    expect(soundOf(undefined)).toEqual({ format: null, channels: null });
  });

  it('names Atmos on its own, since it says more than a channel count', () => {
    expect(soundOf({ codec: 'truehd', channels: 8, isAtmos: true }).channels).toBeNull();
  });

  it('names DTS-HD MA by its profile, with its channels', () => {
    expect(soundOf({ codec: 'dts', channels: 8, isAtmos: false, profile: 'DTS-HD MA' })).toEqual({
      format: 'DTS-HD MA',
      channels: '7.1',
    });
  });

  it('leaves stereo and an ordinary format unsaid', () => {
    expect(soundOf({ codec: 'aac', channels: 2, isAtmos: false })).toEqual({
      format: null,
      channels: null,
    });
  });
});
