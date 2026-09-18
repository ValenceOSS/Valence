import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { planReencode } from './planReencode';

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
    { index: 2, codec: 'aac', channels: 2, language: 'eng', isDefault: false, isAtmos: false },
  ],
  subtitleStreams: [
    { index: 3, format: 'pgs', language: 'eng', isForced: false },
    { index: 4, format: 'srt', language: 'fra', isForced: false },
  ],
};

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

describe('planReencode', () => {
  it('encodes the picture down to the chosen rung', () => {
    const plan = planReencode(remux, replacing);

    expect(plan.video).toMatchObject({ kind: 'encode', codec: 'hevc', maxHeight: 1080 });
  });

  it('anchors the bitrate to what the source spends rather than to the rung ceiling', () => {
    const starved = planReencode({ ...remux, bitrateKbps: 2200 }, replacing);

    expect(starved.video.kind).toBe('encode');
    expect(starved.video.kind === 'encode' ? starved.video.maxBitrateKbps : 0).toBeGreaterThan(0);
  });

  it('carries every audio track, not only the default one', () => {
    expect(planReencode(remux, replacing).audioTracks.map((track) => track.index)).toEqual([1, 2]);
  });

  it('copies every track where the audio is being kept', () => {
    expect(planReencode(remux, replacing).audioTracks.every((one) => one.kind === 'copy')).toBe(
      true,
    );
  });

  it('compresses only the lossless tracks, leaving a lossy one alone', () => {
    const plan = planReencode(remux, { ...replacing, audio: 'compress' });

    expect(plan.audioTracks[0]).toMatchObject({ kind: 'encode', index: 1, codec: 'eac3' });
    expect(plan.audioTracks[1]).toMatchObject({ kind: 'copy', index: 2 });
  });

  it('leaves the picture untouched for audio-only work, and compresses regardless', () => {
    const plan = planReencode(remux, {
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'keep',
    });

    expect(plan.video).toEqual({ kind: 'copy' });
    expect(plan.audioTracks[0]?.kind).toBe('encode');
  });

  it('keeps the same picture when only the codec changes', () => {
    const plan = planReencode(remux, { ...replacing, quality: null });

    expect(plan.video).toMatchObject({ kind: 'encode', maxWidth: 3840, maxHeight: 2160 });
  });

  it('carries every subtitle track, bitmap ones included', () => {
    expect(planReencode(remux, replacing).subtitleIndexes).toEqual([3, 4]);
  });
});
