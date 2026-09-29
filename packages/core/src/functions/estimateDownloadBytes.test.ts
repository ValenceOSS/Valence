import { describe, expect, it } from 'vitest';
import { estimateDownloadBytes } from './estimateDownloadBytes';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const FILM: MediaItem = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  title: 'Arrival',
  year: 2016,
  container: 'mp4',
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

const REASON = { code: 'ClientSupportsSource', detail: 'as it is' } as const;

const copied: PlaybackPlan = {
  mediaId: FILM.id,
  container: { kind: 'passthrough', reason: REASON },
  video: { kind: 'passthrough', reason: REASON },
  audio: { kind: 'passthrough', streamIndex: 1, reason: REASON },
  subtitles: { kind: 'none', reason: REASON },
};

const encodedAt = (videoKbps: number): PlaybackPlan => ({
  ...copied,
  video: {
    kind: 'transcode',
    codec: 'h264',
    range: 'SDR',
    maxBitrateKbps: videoKbps,
    maxWidth: 1280,
    maxHeight: 720,
    reason: REASON,
  },
});

describe('estimateDownloadBytes', () => {
  it('gives a file copied as it is its own size, since that size is recorded rather than guessed', () => {
    expect(estimateDownloadBytes({ plan: copied, source: FILM, sizeBytes: 7_000_000_000 })).toBe(
      7_000_000_000,
    );
  });

  it('says nothing about a copy whose size was never recorded', () => {
    expect(estimateDownloadBytes({ plan: copied, source: FILM, sizeBytes: 0 })).toBeNull();
  });

  it('prices an encode at the bitrate it is given, and the sound it keeps', () => {
    const bytes = estimateDownloadBytes({
      plan: encodedAt(2500),
      source: FILM,
      sizeBytes: 7_000_000_000,
    });

    expect(bytes).toBe(((2500 + 192) * 1000 * 7200) / 8);
  });

  it('prices an encode given less at less, rather than always at the rung', () => {
    const generous = estimateDownloadBytes({
      plan: encodedAt(2500),
      source: FILM,
      sizeBytes: 7_000_000_000,
    });
    const spare = estimateDownloadBytes({
      plan: encodedAt(1200),
      source: FILM,
      sizeBytes: 7_000_000_000,
    });

    expect(spare ?? 0).toBeLessThan(generous ?? 0);
  });

  it('prices re-encoded sound at what it is encoded to', () => {
    const plan: PlaybackPlan = {
      ...encodedAt(2500),
      audio: {
        kind: 'transcode',
        streamIndex: 1,
        codec: 'aac',
        channels: 2,
        maxBitrateKbps: 128,
        reason: REASON,
      },
    };

    expect(estimateDownloadBytes({ plan, source: FILM, sizeBytes: 7_000_000_000 })).toBe(
      ((2500 + 128) * 1000 * 7200) / 8,
    );
  });

  it('says nothing where the runtime is not known, rather than estimating from nothing', () => {
    expect(
      estimateDownloadBytes({
        plan: encodedAt(2500),
        source: { ...FILM, durationSeconds: 0 },
        sizeBytes: 7_000_000_000,
      }),
    ).toBeNull();
  });
});
