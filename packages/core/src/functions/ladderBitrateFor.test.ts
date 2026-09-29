import { describe, expect, it } from 'vitest';
import { ladderBitrateFor } from './ladderBitrateFor';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

const EPISODE: MediaItem = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  title: 'My Two Dads',
  year: 2024,
  container: 'mkv',
  durationSeconds: 2362,
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

const REMUX: MediaItem = {
  ...EPISODE,
  videoCodec: 'hevc',
  bitrateKbps: 40_000,
  width: 3840,
  height: 2160,
};

describe('ladderBitrateFor', () => {
  it('gives a smaller picture less than the whole of the source', () => {
    const at720 = ladderBitrateFor({
      media: EPISODE,
      targetCodec: 'hevc',
      maxWidth: 1280,
      maxHeight: 720,
    });

    expect(at720).toBeLessThan(EPISODE.bitrateKbps);
  });

  it('allows for H.264 needing more bits than the HEVC it came from', () => {
    const inHevc = ladderBitrateFor({
      media: EPISODE,
      targetCodec: 'hevc',
      maxWidth: 854,
      maxHeight: 480,
    });
    const inH264 = ladderBitrateFor({
      media: EPISODE,
      targetCodec: 'h264',
      maxWidth: 854,
      maxHeight: 480,
    });

    expect(inH264).toBeGreaterThan(inHevc);
  });

  it('gives a richer source a richer ladder, rather than one figure for every film', () => {
    const episode = ladderBitrateFor({
      media: EPISODE,
      targetCodec: 'h264',
      maxWidth: 1280,
      maxHeight: 720,
    });
    const remux = ladderBitrateFor({
      media: REMUX,
      targetCodec: 'h264',
      maxWidth: 1280,
      maxHeight: 720,
    });

    expect(remux).toBeGreaterThan(episode * 10);
  });

  it('never lets a guess at the sound swallow the picture', () => {
    const lean: MediaItem = {
      ...REMUX,
      bitrateKbps: 4_500,
      audioStreams: [
        { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
      ],
    };

    expect(
      ladderBitrateFor({ media: lean, targetCodec: 'hevc', maxWidth: 1920, maxHeight: 1080 }),
    ).toBeGreaterThan(500);
  });

  it('never drops a picture below what anything can be watched at', () => {
    expect(
      ladderBitrateFor({
        media: { ...EPISODE, bitrateKbps: 600 },
        targetCodec: 'h264',
        maxWidth: 256,
        maxHeight: 144,
      }),
    ).toBe(100);
  });
});
