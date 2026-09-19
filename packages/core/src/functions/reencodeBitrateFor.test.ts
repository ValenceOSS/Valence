import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { reencodeBitrateFor } from './reencodeBitrateFor';

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
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

describe('reencodeBitrateFor', () => {
  it("holds the ceiling at the rung's, which is not scaled for the codec", () => {
    expect(reencodeBitrateFor(remux, '1080p', 'hevc').capKbps).toBe(4500);
    expect(reencodeBitrateFor(remux, '1080p', 'h264').capKbps).toBe(4500);
  });

  it('expects a more efficient codec to spend less for the same picture', () => {
    const asH264 = reencodeBitrateFor(remux, '1080p', 'h264').expectedKbps;
    const asHevc = reencodeBitrateFor(remux, '1080p', 'hevc').expectedKbps;
    const asAv1 = reencodeBitrateFor(remux, '1080p', 'av1').expectedKbps;

    expect(asHevc).toBeLessThan(asH264);
    expect(asAv1).toBeLessThan(asHevc);
  });

  it('never allows more than the source itself spends', () => {
    const starved = { ...remux, bitrateKbps: 1800 };

    expect(reencodeBitrateFor(starved, '1080p', 'hevc').capKbps).toBe(1800);
    expect(reencodeBitrateFor(starved, '1080p', 'hevc').expectedKbps).toBeLessThanOrEqual(1800);
  });

  it('allows high frame rate content more than the ladder states, since the ladder is not about it', () => {
    const sixty = { ...remux, videoFrameRate: 60 };

    expect(reencodeBitrateFor(sixty, '1080p', 'hevc').capKbps).toBeGreaterThan(
      reencodeBitrateFor(remux, '1080p', 'hevc').capKbps,
    );
  });

  it('anchors to the source where no rung was chosen, for a codec change at the same size', () => {
    const { capKbps, expectedKbps } = reencodeBitrateFor(remux, null, 'hevc');

    expect(capKbps).toBe(66000);
    expect(expectedKbps).toBe(Math.round(66000 * 0.6));
  });

  it('spends no more than the source when the codec is no more efficient than it', () => {
    const hevcSource = { ...remux, videoCodec: 'hevc' };

    expect(reencodeBitrateFor(hevcSource, null, 'h264').expectedKbps).toBe(66000);
  });
});
