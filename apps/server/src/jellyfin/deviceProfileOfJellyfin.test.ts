import { describe, expect, it } from 'vitest';
import { deviceProfileOfJellyfin } from './deviceProfileOfJellyfin';
import { JellyfinDeviceProfileSchema } from './JellyfinRequests';

describe('deviceProfileOfJellyfin', () => {
  it('reads what the app plays as it is, container by container', () => {
    const profile = deviceProfileOfJellyfin(
      JellyfinDeviceProfileSchema.parse({
        maxstreamingbitrate: 20_000_000,
        directplayprofiles: [
          { container: 'mkv,m4v', type: 'Video', videocodec: 'h264,hevc', audiocodec: 'aac' },
          { container: 'mp3', type: 'Audio' },
        ],
        transcodingprofiles: [
          {
            container: 'ts',
            type: 'Video',
            videocodec: 'h264',
            audiocodec: 'aac',
            protocol: 'hls',
          },
        ],
        subtitleprofiles: [
          { format: 'subrip', method: 'External' },
          { format: 'pgssub', method: 'Encode' },
        ],
      }),
      'Findroid',
      null,
      null,
    );

    expect(profile.directPlayProfiles).toEqual([
      { container: 'mkv', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac'] },
      { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac'] },
    ]);
    expect(profile.transcodingProfiles).toEqual([
      { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ]);
    expect(profile.maxBitrateKbps).toBe(20_000);
    expect(profile.supportedSubtitleFormats).toEqual(['srt']);
    expect(profile.tenBitVideoCodecs).toEqual(['hevc']);
  });

  it('reads limits and ranges from the codec profiles', () => {
    const profile = deviceProfileOfJellyfin(
      JellyfinDeviceProfileSchema.parse({
        directplayprofiles: [{ container: 'mp4', type: 'Video', videocodec: 'hevc' }],
        codecprofiles: [
          {
            type: 'Video',
            codec: 'hevc',
            conditions: [
              { condition: 'LessThanEqual', property: 'Width', value: '1920' },
              { condition: 'LessThanEqual', property: 'VideoBitDepth', value: '8' },
              { condition: 'EqualsAny', property: 'VideoRangeType', value: 'SDR|HDR10|DOVI' },
            ],
          },
        ],
      }),
      'Swiftfin',
      null,
      6,
    );

    expect(profile.maxWidth).toBe(1920);
    expect(profile.maxAudioChannels).toBe(6);
    expect(profile.tenBitVideoCodecs).toEqual([]);
    expect(profile.supportedVideoRanges).toEqual(['SDR', 'HDR10', 'DolbyVision']);
  });

  it('takes an app that sends no profile to play what current Jellyfin apps play', () => {
    const profile = deviceProfileOfJellyfin(null, 'Infuse', null, null);

    expect(profile.directPlayProfiles.map((one) => one.container)).toEqual(['mp4', 'mkv', 'webm']);
    expect(profile.transcodingProfiles[0]).toMatchObject({ container: 'ts', protocol: 'hls' });
    expect(profile.supportedVideoRanges).toEqual(['SDR']);
  });
});
