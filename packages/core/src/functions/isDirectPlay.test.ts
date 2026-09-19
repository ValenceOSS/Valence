import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { isDirectPlay } from './isDirectPlay';
import { negotiatePlayback } from './negotiatePlayback';

const media: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Sample Film',
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
  ],
  subtitleStreams: [],
};

const profile: DeviceProfile = {
  schemaVersion: 1,
  name: 'Living room TV',
  maxWidth: 3840,
  maxHeight: 2160,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR', 'HDR10'],
  tenBitVideoCodecs: [],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['srt', 'webvtt'],
  directPlayProfiles: [
    { container: 'mkv', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
  ],
  transcodingProfiles: [
    { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

describe('isDirectPlay', () => {
  it('is true when every axis passes through and the natural track is the one being sent', () => {
    expect(isDirectPlay(negotiatePlayback(media, profile), media)).toBe(true);
  });

  it('is false when the container has to be rewrapped', () => {
    const rewrapped = { ...media, container: 'avi' };

    expect(isDirectPlay(negotiatePlayback(rewrapped, profile), rewrapped)).toBe(false);
  });

  it('is false for HEVC, which goes through a session so its tag is right', () => {
    const hevc = { ...media, videoCodec: 'hevc' };

    expect(negotiatePlayback(hevc, profile).video.kind).toBe('passthrough');
    expect(isDirectPlay(negotiatePlayback(hevc, profile), hevc)).toBe(false);
  });

  it('is false when a track other than the natural one is being sent', () => {
    const twoTracks: MediaItem = {
      ...media,
      audioStreams: [
        { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: false },
        { index: 2, codec: 'aac', channels: 2, language: 'fra', isDefault: false, isAtmos: false },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(twoTracks, profile, null, 'fra'), twoTracks)).toBe(false);
  });
});
