import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { estimateReencodeBytes } from './estimateReencodeBytes';

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

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

describe('estimateReencodeBytes', () => {
  it('quotes a fraction of the original for a remux going to 1080p', () => {
    const estimated = estimateReencodeBytes(remux, replacing);

    expect(estimated).not.toBeNull();
    expect(estimated ?? 0).toBeLessThan(remux.sizeBytes ?? 0);
  });

  it('quotes less for a smaller rung than for a larger one', () => {
    const at720 = estimateReencodeBytes(remux, { ...replacing, quality: '720p' }) ?? 0;
    const at1080 = estimateReencodeBytes(remux, replacing) ?? 0;

    expect(at720).toBeLessThan(at1080);
  });

  it('quotes less for a more efficient codec at the same rung', () => {
    const asH264 = estimateReencodeBytes(remux, { ...replacing, videoCodec: 'h264' }) ?? 0;
    const asAv1 = estimateReencodeBytes(remux, { ...replacing, videoCodec: 'av1' }) ?? 0;

    expect(asAv1).toBeLessThan(asH264);
  });

  it('takes the audio off the measured size for audio-only work, rather than guessing the video', () => {
    const estimated = estimateReencodeBytes(remux, {
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'compress',
    });

    expect(estimated).not.toBeNull();
    expect(estimated ?? 0).toBeLessThan(remux.sizeBytes ?? 0);
    expect(estimated ?? 0).toBeGreaterThan((remux.sizeBytes ?? 0) * 0.8);
  });

  it('says nothing for audio-only work on a file whose size nobody recorded', () => {
    const estimated = estimateReencodeBytes(
      { ...remux, sizeBytes: null },
      { mode: 'audioOnly', quality: null, videoCodec: null, audio: 'compress' },
    );

    expect(estimated).toBeNull();
  });

  it('says nothing for a file with no runtime to multiply by', () => {
    expect(estimateReencodeBytes({ ...remux, durationSeconds: 0 }, replacing)).toBeNull();
  });
});
