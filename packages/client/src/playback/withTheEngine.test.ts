import { describe, expect, it } from 'vitest';
import { withTheEngine } from '@ValenceClient/playback/withTheEngine';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const BROWSER: DeviceProfile = {
  schemaVersion: 1,
  name: 'Browser',
  maxWidth: 3840,
  maxHeight: 2160,
  maxAudioChannels: 2,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: ['vp9'],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [
    { container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] },
    { container: 'avi', videoCodecs: ['h264'], audioCodecs: ['mp3'] },
  ],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

describe('withTheEngine', () => {
  it('claims every container the player reads with every codec it decodes, beside what was claimed', () => {
    const profile = withTheEngine(BROWSER, {
      videoCodecs: ['hevc', 'h264'],
      tenBitVideoCodecs: ['hevc'],
      audioCodecs: ['ac3', 'aac'],
    });

    expect(profile.directPlayProfiles).toEqual([
      { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'ac3'] },
      { container: 'avi', videoCodecs: ['h264'], audioCodecs: ['mp3'] },
      { container: 'mkv', videoCodecs: ['hevc', 'h264'], audioCodecs: ['ac3', 'aac'] },
      { container: 'webm', videoCodecs: ['hevc', 'h264'], audioCodecs: ['ac3', 'aac'] },
      { container: 'mov', videoCodecs: ['hevc', 'h264'], audioCodecs: ['ac3', 'aac'] },
      { container: 'ts', videoCodecs: ['hevc', 'h264'], audioCodecs: ['ac3', 'aac'] },
    ]);
    expect(profile.tenBitVideoCodecs).toEqual(['vp9', 'hevc']);
  });

  it('leaves the profile as it was where the player plays nothing', () => {
    expect(
      withTheEngine(BROWSER, { videoCodecs: [], tenBitVideoCodecs: [], audioCodecs: ['aac'] }),
    ).toBe(BROWSER);
  });
});
