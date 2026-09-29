import { describe, expect, it } from 'vitest';
import { stepsThatSaveNothing } from './stepsThatSaveNothing';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

const LAPTOP: DeviceProfile = {
  schemaVersion: 1,
  name: 'Laptop',
  maxWidth: 3840,
  maxHeight: 2160,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: [],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['srt', 'webvtt'],
  directPlayProfiles: [{ container: 'mkv', videoCodecs: ['hevc', 'h264'], audioCodecs: ['aac'] }],
  transcodingProfiles: [
    { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

const AN_EPISODE: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'My Two Dads',
  year: 2024,
  container: 'mkv',
  durationSeconds: 2253,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 1520,
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
  ],
  subtitleStreams: [],
};

describe('stepsThatSaveNothing', () => {
  it('names a smaller picture that would cost about what the original does', () => {
    expect(stepsThatSaveNothing({ media: AN_EPISODE, profile: LAPTOP })).toContain('720p');
  });

  it('leaves out a smaller picture that really is smaller', () => {
    expect(stepsThatSaveNothing({ media: AN_EPISODE, profile: LAPTOP })).not.toContain('480p');
  });

  it('names nothing for a film with room to lose', () => {
    const rich: MediaItem = { ...AN_EPISODE, videoCodec: 'h264', bitrateKbps: 12_000 };

    expect(stepsThatSaveNothing({ media: rich, profile: LAPTOP })).toEqual([]);
  });
});
