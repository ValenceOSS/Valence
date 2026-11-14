import { describe, expect, it } from 'vitest';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { jellyfinProfileOfDevice } from './jellyfinProfileOfDevice';

describe('jellyfinProfileOfDevice', () => {
  it('says what the app plays as a Jellyfin device profile', () => {
    const profile = jellyfinProfileOfDevice(
      DeviceProfileSchema.parse({
        schemaVersion: 1,
        name: 'A phone',
        maxWidth: 1920,
        maxHeight: 1080,
        maxBitrateKbps: 8000,
        maxAudioChannels: 6,
        supportedVideoRanges: ['SDR', 'DolbyVision'],
        tenBitVideoCodecs: ['hevc'],
        supportedSubtitleFormats: ['webvtt', 'srt'],
        directPlayProfiles: [
          { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
        ],
        transcodingProfiles: [
          { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
        ],
      }),
    );

    expect(profile).toMatchObject({
      MaxStreamingBitrate: 8_000_000,
      DirectPlayProfiles: [{ Container: 'mp4', VideoCodec: 'h264,hevc', AudioCodec: 'aac,eac3' }],
      TranscodingProfiles: [{ Container: 'ts', Protocol: 'hls', VideoCodec: 'h264' }],
      SubtitleProfiles: [{ Format: 'vtt' }, { Format: 'srt' }],
    });
    expect(JSON.stringify(profile.CodecProfiles)).toContain('SDR|DOVI');
    const codecs = profile.CodecProfiles.map((one) => ('Codec' in one ? one.Codec : null));

    expect(codecs).toContain('h264');
    expect(codecs).not.toContain('hevc');
  });
});
