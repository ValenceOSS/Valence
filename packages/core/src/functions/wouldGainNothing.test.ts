import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { wouldGainNothing } from './wouldGainNothing';

const remux: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  sizeBytes: 70_000_000_000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const alreadySmall: MediaItem = {
  ...remux,
  width: 1280,
  height: 720,
  bitrateKbps: 2000,
  sizeBytes: 2_400_000_000,
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
  ],
};

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

describe('wouldGainNothing', () => {
  it('lets a remux be replaced, which is the whole point', () => {
    expect(wouldGainNothing(remux, replacing)).toBe(false);
  });

  it('refuses a file already at the target in the same codec, which would be pure loss', () => {
    expect(
      wouldGainNothing(alreadySmall, { ...replacing, quality: '720p', videoCodec: 'h264' }),
    ).toBe(true);
  });

  it('refuses a rung larger than the file already is', () => {
    expect(
      wouldGainNothing(alreadySmall, { ...replacing, quality: '2160p', videoCodec: 'h264' }),
    ).toBe(true);
  });

  it('allows a more efficient codec at the same rung, which is a real saving', () => {
    expect(wouldGainNothing({ ...remux, width: 1920, height: 1080 }, replacing)).toBe(false);
  });

  it('refuses audio-only work on a file whose tracks are already compressed', () => {
    const settings: ReencodeSettings = {
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'compress',
    };

    expect(wouldGainNothing(alreadySmall, settings)).toBe(true);
  });

  it('allows audio-only work on a remux carrying a lossless track', () => {
    const settings: ReencodeSettings = {
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'compress',
    };

    expect(wouldGainNothing({ ...remux, sizeBytes: 20_000_000_000 }, settings)).toBe(false);
  });

  it('refuses keeping a copy that is the same picture in the same codec', () => {
    const settings: ReencodeSettings = {
      mode: 'keep',
      quality: '720p',
      videoCodec: 'h264',
      audio: 'keep',
    };

    expect(wouldGainNothing(alreadySmall, settings)).toBe(true);
  });

  it('allows keeping a copy in a codec the original is not in', () => {
    const settings: ReencodeSettings = {
      mode: 'keep',
      quality: '720p',
      videoCodec: 'hevc',
      audio: 'keep',
    };

    expect(wouldGainNothing(alreadySmall, settings)).toBe(false);
  });

  it('allows keeping a smaller copy of something larger', () => {
    const settings: ReencodeSettings = {
      mode: 'keep',
      quality: '720p',
      videoCodec: 'h264',
      audio: 'keep',
    };

    expect(wouldGainNothing(remux, settings)).toBe(false);
  });

  it('does not refuse a file it cannot weigh, leaving the decision to whoever asked', () => {
    expect(wouldGainNothing({ ...remux, sizeBytes: null }, replacing)).toBe(false);
  });
});
