import { describe, expect, it } from 'vitest';
import { isPlayedNatively } from '@ValenceClient/playback/isPlayedNatively';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const PROFILE: DeviceProfile = {
  schemaVersion: 1,
  name: 'Browser',
  maxWidth: 1920,
  maxHeight: 1080,
  maxAudioChannels: 2,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: [],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: [],
  directPlayProfiles: [{ container: 'mkv', videoCodecs: ['h264'], audioCodecs: ['aac', 'opus'] }],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

describe('isPlayedNatively', () => {
  it('says yes where the element claims the container holding both codecs', () => {
    expect(
      isPlayedNatively(PROFILE, { container: 'mkv', videoCodec: 'h264', audioCodec: 'opus' }),
    ).toBe(true);
  });

  it('says no where the element plays the picture but not the sound', () => {
    expect(
      isPlayedNatively(PROFILE, { container: 'mkv', videoCodec: 'h264', audioCodec: 'ac3' }),
    ).toBe(false);
  });

  it('says no for a container the element never claimed', () => {
    expect(
      isPlayedNatively(PROFILE, { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac' }),
    ).toBe(false);
  });
});
