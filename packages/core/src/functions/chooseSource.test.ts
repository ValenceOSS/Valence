import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { chooseSource } from './chooseSource';
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

describe('chooseSource', () => {
  it('answers nothing where there are no files at all', () => {
    expect(chooseSource({ sources: [], profile: television })).toBeNull();
  });

  it('plays the original where that is the best thing the device can take', () => {
    const chosen = chooseSource({
      sources: [original, smallerCopy('10', 1920, 1080, 6000)],
      profile: television,
    });

    expect(chosen?.source.id).toBe('original');
    expect(chosen?.plan.video.kind).toBe('passthrough');
  });

  it('plays a rendition where the original would have to be encoded for this device', () => {
    const chosen = chooseSource({
      sources: [original, smallerCopy('10', 1920, 1080, 6000)],
      profile: phone,
    });

    expect(chosen?.source.id).toBe('10');
    expect(chosen?.plan.video.kind).toBe('passthrough');
  });

  it('takes the largest rendition the device can take without encoding', () => {
    const chosen = chooseSource({
      sources: [
        original,
        smallerCopy('10', 1920, 1080, 6000),
        smallerCopy('20', 1280, 720, 2500),
      ],
      profile: phone,
    });

    expect(chosen?.source.id).toBe('10');
  });

  it('honours a rung the viewer pinned, because a clamped larger file is no longer passthrough', () => {
    const chosen = chooseSource({
      sources: [
        original,
        smallerCopy('10', 1920, 1080, 6000),
        smallerCopy('20', 1280, 720, 2400),
      ],
      profile: television,
      requestedQuality: '720p',
    });

    expect(chosen?.source.id).toBe('20');
    expect(chosen?.plan.video.kind).toBe('passthrough');
  });

  it('encodes the original rather than a rendition when nothing avoids encoding', () => {
    const noCodecInCommon: DeviceProfile = {
      ...phone,
      directPlayProfiles: [{ container: 'mp4', videoCodecs: ['av1'], audioCodecs: ['opus'] }],
    };

    const chosen = chooseSource({
      sources: [original, smallerCopy('10', 1920, 1080, 6000)],
      profile: noCodecInCommon,
    });

    expect(chosen?.source.isOriginal).toBe(true);
    expect(chosen?.plan.video.kind).toBe('transcode');
  });

  it('keeps an HEVC rendition in the running, since a session copies it rather than encoding it', () => {
    const hevcCopy: PlayableSource = {
      id: '30',
      isOriginal: false,
      item: {
        ...at(remux, 1920, 1080, 5000),
        id: '3f2504e0-4f89-41d3-9a0c-0305e82c3330',
        videoRange: 'SDR',
      },
      path: '/media/Films/Azkaban (2004)/.valence/30.mkv',
    };

    const sdrOnly: DeviceProfile = { ...television, supportedVideoRanges: ['SDR'] };
    const chosen = chooseSource({ sources: [original, hevcCopy], profile: sdrOnly });

    expect(chosen?.source.id).toBe('30');
    expect(chosen?.plan.video.kind).toBe('passthrough');
    expect(chosen?.isDirectPlay).toBe(false);
  });

  it('plays exactly what was pinned, whatever the reasoning would have chosen', () => {
    const chosen = chooseSource({
      sources: [original, smallerCopy('10', 1920, 1080, 6000)],
      profile: phone,
      pinnedSourceId: 'original',
    });

    expect(chosen?.source.id).toBe('original');
  });

  it('ignores a pin naming nothing that is there', () => {
    const chosen = chooseSource({
      sources: [original],
      profile: television,
      pinnedSourceId: 'gone',
    });

    expect(chosen?.source.id).toBe('original');
  });
});
