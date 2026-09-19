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

  it('is true for HEVC in a container with no tag to get wrong, which is every Matroska file', () => {
    const hevc = { ...media, videoCodec: 'hevc' };

    expect(negotiatePlayback(hevc, profile).video.kind).toBe('passthrough');
    expect(isDirectPlay(negotiatePlayback(hevc, profile), hevc)).toBe(true);
  });

  it('is true for an MP4 marked hvc1, which is what a player reads its parameter sets from', () => {
    const hevc = { ...media, container: 'mp4', videoCodec: 'hevc', videoCodecTag: 'hvc1' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(hevc, takesMp4), hevc)).toBe(true);
  });

  it('is false for an MP4 marked hev1, which Safari refuses and Chromium draws nothing from', () => {
    const hevc = { ...media, container: 'mp4', videoCodec: 'hevc', videoCodecTag: 'hev1' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(negotiatePlayback(hevc, takesMp4).video.kind).toBe('passthrough');
    expect(isDirectPlay(negotiatePlayback(hevc, takesMp4), hevc)).toBe(false);
  });

  it('is false for an MP4 probed before Valence read the tag, because no answer is not hvc1', () => {
    const hevc = { ...media, container: 'mp4', videoCodec: 'hevc' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(hevc, takesMp4), hevc)).toBe(false);
  });

  it('is false for an MP4 marked avc3, which keeps its parameter sets where a player may not look', () => {
    const h264 = { ...media, container: 'mp4', videoCodecTag: 'avc3' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(negotiatePlayback(h264, takesMp4).video.kind).toBe('passthrough');
    expect(isDirectPlay(negotiatePlayback(h264, takesMp4), h264)).toBe(false);
  });

  it('is true for an MP4 marked avc1, which is what almost everything writes', () => {
    const h264 = { ...media, container: 'mp4', videoCodecTag: 'avc1' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(h264, takesMp4), h264)).toBe(true);
  });

  it('still hands over an H.264 MP4 probed before Valence read the tag, unlike HEVC', () => {
    const h264 = { ...media, container: 'mp4' };
    const takesMp4: DeviceProfile = {
      ...profile,
      directPlayProfiles: [
        { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'eac3'] },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(h264, takesMp4), h264)).toBe(true);
  });

  it('is false when a track other than the natural one is being sent', () => {
    const twoTracks: MediaItem = {
      ...media,
      audioStreams: [
        {
          index: 1,
          codec: 'truehd',
          channels: 8,
          language: 'eng',
          isDefault: true,
          isAtmos: false,
        },
        { index: 2, codec: 'aac', channels: 2, language: 'fra', isDefault: false, isAtmos: false },
      ],
    };

    expect(isDirectPlay(negotiatePlayback(twoTracks, profile, null, 'fra'), twoTracks)).toBe(false);
  });
});
