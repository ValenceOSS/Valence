import { describe, expect, it } from 'vitest';
import { withTheEngine } from '@ValenceClient/playback/withTheEngine';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { EngineSupport } from '@ValenceClient/playback/EngineSupport';

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

const SUPPORT: EngineSupport = {
  videoCodecs: ['hevc', 'h264'],
  tenBitVideoCodecs: ['hevc'],
  remuxVideoCodecs: ['h264', 'av1'],
  remuxTenBitVideoCodecs: ['av1'],
  toneMappedCodecs: ['hevc'],
  audioCodecs: ['ac3', 'aac'],
};

describe('withTheEngine', () => {
  it('claims every container the browser reads with every codec it plays, beside what was claimed', () => {
    const profile = withTheEngine(BROWSER, SUPPORT, { isHdr: false });

    expect(profile.directPlayProfiles).toEqual([
      { container: 'mp4', videoCodecs: ['h264', 'hevc', 'av1'], audioCodecs: ['aac', 'ac3'] },
      { container: 'avi', videoCodecs: ['h264'], audioCodecs: ['mp3'] },
      { container: 'mkv', videoCodecs: ['hevc', 'h264', 'av1'], audioCodecs: ['ac3', 'aac'] },
      { container: 'webm', videoCodecs: ['hevc', 'h264', 'av1'], audioCodecs: ['ac3', 'aac'] },
      { container: 'mov', videoCodecs: ['hevc', 'h264', 'av1'], audioCodecs: ['ac3', 'aac'] },
      { container: 'ts', videoCodecs: ['hevc', 'h264', 'av1'], audioCodecs: ['ac3', 'aac'] },
    ]);
    expect(profile.tenBitVideoCodecs).toEqual(['vp9', 'hevc', 'av1']);
    expect(profile.supportedVideoRanges).toEqual(['SDR']);
  });

  it('claims for an HDR film only what is repackaged and the HEVC it tone maps, and the ranges that need', () => {
    const profile = withTheEngine(BROWSER, SUPPORT, { isHdr: true });

    expect(
      profile.directPlayProfiles.find((entry) => entry.container === 'mkv')?.videoCodecs,
    ).toEqual(['h264', 'av1', 'hevc']);
    expect(profile.supportedVideoRanges).toEqual(['SDR', 'HDR10', 'HDR10Plus', 'HLG']);
  });

  it('claims no new range where nothing can tone map', () => {
    const profile = withTheEngine(BROWSER, { ...SUPPORT, toneMappedCodecs: [] }, { isHdr: true });

    expect(profile.supportedVideoRanges).toEqual(['SDR']);
  });

  it('leaves the profile as it was where the browser plays nothing more', () => {
    expect(
      withTheEngine(
        BROWSER,
        { ...SUPPORT, videoCodecs: [], remuxVideoCodecs: [] },
        { isHdr: false },
      ),
    ).toBe(BROWSER);
  });

  it('claims MPEG-2 for a DVD but leaves an HD one to the server', () => {
    const withMpeg2 = { ...SUPPORT, videoCodecs: ['mpeg2', 'h264'] };
    const mp4Of = (profile: DeviceProfile) =>
      profile.directPlayProfiles.find(({ container }) => container === 'mp4')?.videoCodecs;

    expect(mp4Of(withTheEngine(BROWSER, withMpeg2, { isHdr: false, height: 576 }))).toContain(
      'mpeg2',
    );
    expect(mp4Of(withTheEngine(BROWSER, withMpeg2, { isHdr: false, height: 1080 }))).not.toContain(
      'mpeg2',
    );
  });
});
