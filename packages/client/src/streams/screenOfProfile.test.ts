import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import { screenOfProfile } from './screenOfProfile';

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
  directPlayProfiles: [{ container: 'mkv', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac'] }],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

describe('screenOfProfile', () => {
  it('reads how sharp a device shows, whether it shows HDR, and how long the film is', () => {
    expect(screenOfProfile(PROFILE, 120)).toMatchObject({
      maxHeight: 1080,
      showsHdr: false,
      runtimeMinutes: 120,
    });
    expect(
      screenOfProfile({ ...PROFILE, supportedVideoRanges: ['SDR', 'HDR10'] }, null).showsHdr,
    ).toBe(true);
  });

  it('plays as it is only a codec the device decodes', () => {
    const screen = screenOfProfile(PROFILE, null);

    expect(screen.playsCodec('h264')).toBe(true);
    expect(screen.playsCodec('h265')).toBe(true);
    expect(screen.playsCodec('av1')).toBe(false);
    expect(screen.playsCodec('xvid')).toBe(false);
  });
});
