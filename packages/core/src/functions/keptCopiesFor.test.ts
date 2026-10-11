import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { keptCopiesFor } from './keptCopiesFor';
import type { PlayableSource } from './chooseSource';

const remux: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const at = (item: MediaItem, width: number, height: number, bitrateKbps: number): MediaItem => ({
  ...item,
  width,
  height,
  bitrateKbps,
});

const television: DeviceProfile = {
  schemaVersion: 1,
  name: 'Living room TV',
  maxWidth: 3840,
  maxHeight: 2160,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR', 'HDR10'],
  tenBitVideoCodecs: ['hevc'],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['srt', 'webvtt'],
  directPlayProfiles: [
    { container: 'mkv', videoCodecs: ['hevc', 'h264'], audioCodecs: ['truehd', 'eac3', 'aac'] },
  ],
  transcodingProfiles: [
    { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

const phone: DeviceProfile = {
  ...television,
  name: 'Phone',
  maxWidth: 1920,
  maxHeight: 1080,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: [],
  directPlayProfiles: [
    { container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] },
    { container: 'mkv', videoCodecs: ['h264'], audioCodecs: ['aac', 'eac3'] },
  ],
};

const laptop: DeviceProfile = { ...phone, name: 'Laptop', maxWidth: 3840, maxHeight: 2160 };

const original: PlayableSource = {
  id: 'original',
  isOriginal: true,
  item: remux,
  path: '/media/Films/Azkaban (2004)/Azkaban (2004).mkv',
};

const smallerCopy = (
  id: string,
  width: number,
  height: number,
  bitrateKbps: number,
): PlayableSource => ({
  id,
  isOriginal: false,
  item: {
    ...at(remux, width, height, bitrateKbps),
    id: `3f2504e0-4f89-41d3-9a0c-0305e82c33${id}`,
    videoCodec: 'h264',
    videoRange: 'SDR',
    videoBitDepth: 8,
    audioStreams: [
      { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
    ],
  },
  path: `/media/Films/Azkaban (2004)/.valence/${id}.mkv`,
});

const fileUrl = (sourceId: string) => `/api/playback/film/file?rendition=${sourceId}`;

describe('keptCopiesFor', () => {
  it('lists each copy the device plays as it is, named for its picture, largest first', () => {
    expect(
      keptCopiesFor({
        sources: [
          original,
          smallerCopy('10', 1920, 1080, 4000),
          smallerCopy('20', 1280, 720, 2000),
        ],
        profile: laptop,
        fileUrl,
      }).map((copy) => [copy.quality, copy.url, copy.height]),
    ).toEqual([
      ['1080p', '/api/playback/film/file?rendition=10', 1080],
      ['720p', '/api/playback/film/file?rendition=20', 720],
    ]);
  });

  it('lists nothing where the original is what every step plays', () => {
    expect(
      keptCopiesFor({
        sources: [original, smallerCopy('10', 1920, 1080, 6000)],
        profile: television,
        fileUrl,
      }).map((copy) => copy.quality),
    ).not.toContain('2160p');
  });

  it('names an ultrawide copy for its width', () => {
    expect(
      keptCopiesFor({
        sources: [original, smallerCopy('30', 3840, 1600, 12000)],
        profile: laptop,
        fileUrl,
      }).map((copy) => copy.quality),
    ).toEqual(['2160p']);
  });

  it('lists nothing where there are no copies', () => {
    expect(keptCopiesFor({ sources: [original], profile: laptop, fileUrl })).toEqual([]);
  });
});
