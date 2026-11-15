import { describe, expect, it } from 'vitest';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { surroundCodecFor } from './surroundCodecFor';

const profile = DeviceProfileSchema.parse({
  schemaVersion: 1,
  name: 'Phone',
  maxWidth: 1920,
  maxHeight: 1080,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR'],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac', 'eac3'] }],
  transcodingProfiles: [
    { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
});

const asking = { ...profile, surroundAudioCodec: 'eac3' };

describe('surroundCodecFor', () => {
  it('encodes three to six channels as Dolby Digital Plus for a client that asked for it', () => {
    expect(surroundCodecFor(asking, 3)).toBe('eac3');
    expect(surroundCodecFor(asking, 6)).toBe('eac3');
  });

  it('leaves stereo to the transcoding profile', () => {
    expect(surroundCodecFor(asking, 2)).toBeNull();
    expect(surroundCodecFor(asking, 1)).toBeNull();
  });

  it('leaves 7.1 to the transcoding profile rather than lose two channels', () => {
    expect(surroundCodecFor(asking, 8)).toBeNull();
  });

  it('does nothing for a client that did not ask, or asked for something else', () => {
    expect(surroundCodecFor(profile, 6)).toBeNull();
    expect(surroundCodecFor({ ...profile, surroundAudioCodec: 'dts' }, 6)).toBeNull();
  });
});
