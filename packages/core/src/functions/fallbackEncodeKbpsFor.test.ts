import { describe, expect, it } from 'vitest';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { fallbackEncodeKbpsFor } from './fallbackEncodeKbpsFor';

const browser = DeviceProfileSchema.parse({
  schemaVersion: 1,
  name: 'Browser',
  maxWidth: 1920,
  maxHeight: 1080,
  maxAudioChannels: 2,
  supportedVideoRanges: ['SDR'],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac'] }],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
});

const film = { bitrateKbps: 4841, videoCodec: 'hevc', width: 1920, height: 800 };

describe('fallbackEncodeKbpsFor', () => {
  it('gives an HEVC film more bits as H.264 than it had, since H.264 needs more', () => {
    expect(fallbackEncodeKbpsFor(film, browser)).toBeGreaterThan(7500);
  });

  it('gives an H.264 film its own bitrate again', () => {
    expect(fallbackEncodeKbpsFor({ ...film, videoCodec: 'h264' }, browser)).toBe(4841);
  });

  it('stays within a ceiling the client stated', () => {
    expect(fallbackEncodeKbpsFor(film, { ...browser, maxBitrateKbps: 6000 })).toBe(6000);
  });

  it('stays within the quality step the copy was allowed under, such as a linked server’s limit', () => {
    expect(
      fallbackEncodeKbpsFor(film, browser, {
        maxWidth: 1920,
        maxHeight: 1080,
        maxVideoBitrateKbps: 5000,
        maxAudioBitrateKbps: null,
      }),
    ).toBe(5000);
  });

  it('takes the lower of the client’s ceiling and the step’s', () => {
    expect(
      fallbackEncodeKbpsFor(
        film,
        { ...browser, maxBitrateKbps: 5500 },
        { maxWidth: 1920, maxHeight: 1080, maxVideoBitrateKbps: 7000, maxAudioBitrateKbps: null },
      ),
    ).toBe(5500);
  });
});
