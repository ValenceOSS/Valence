import { describe, expect, it } from 'vitest';
import {
  REENCODE_MODES,
  ReencodeEstimateSchema,
  ReencodeRequestSchema,
  ReencodeSchema,
  ReencodeStartedSchema,
} from './Reencode';

const mediaId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const validReencode = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
  mediaId,
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3303',
  title: 'Harry Potter and the Prisoner of Azkaban',
  seriesTitle: null,
  mode: 'replace',
  state: 'awaitingReview',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 8520,
  originalSizeBytes: 70_000_000_000,
  estimatedBytes: 6_000_000_000,
  producedBytes: 5_600_000_000,
  progress: 1,
  bytesPerSecond: null,
  failure: null,
  askedAt: '2026-09-18T22:00:00.000Z',
  startedAt: '2026-09-18T22:01:00.000Z',
  encodedAt: '2026-09-18T23:40:00.000Z',
  reviewedAt: null,
};

describe('ReencodeRequestSchema', () => {
  it('accepts a bulk request naming what to do to every file in it', () => {
    const result = ReencodeRequestSchema.parse({
      mediaIds: [mediaId],
      mode: 'replace',
      quality: '1080p',
      videoCodec: 'hevc',
      audio: 'keep',
    });

    expect(result.mediaIds).toHaveLength(1);
    expect(result.mode).toBe('replace');
  });

  it('accepts audio-only work, which names no rung and no video codec', () => {
    const result = ReencodeRequestSchema.parse({
      mediaIds: [mediaId],
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'compress',
    });

    expect(result.quality).toBeNull();
    expect(result.videoCodec).toBeNull();
  });

  it('refuses a request naming nothing to work on', () => {
    expect(() =>
      ReencodeRequestSchema.parse({
        mediaIds: [],
        mode: 'replace',
        quality: '1080p',
        videoCodec: 'hevc',
        audio: 'keep',
      }),
    ).toThrow();
  });

  it('offers replacing, keeping alongside, and audio alone', () => {
    expect(REENCODE_MODES).toEqual(['replace', 'keep', 'audioOnly']);
  });
});

describe('ReencodeSchema', () => {
  it('accepts an encode waiting for somebody to judge it', () => {
    const result = ReencodeSchema.parse(validReencode);

    expect(result.state).toBe('awaitingReview');
    expect(result.hasSample).toBe(false);
  });

  it('refuses progress beyond the whole of it', () => {
    expect(() => ReencodeSchema.parse({ ...validReencode, progress: 1.4 })).toThrow();
  });
});

describe('ReencodeEstimateSchema', () => {
  it('says what is held now and what would be held after, both ways round', () => {
    const result = ReencodeEstimateSchema.parse({
      candidates: [],
      nowBytes: 70_000_000_000,
      afterBytes: 6_000_000_000,
      freeBytes: 800_000_000_000,
      committedBytes: 120_000_000_000,
      awaitingReview: 3,
      awaitingReviewCap: 5,
    });

    expect(result.afterBytes).toBeLessThan(result.nowBytes);
    expect(result.committedBytes).toBe(120_000_000_000);
  });

  it('accepts free space nobody could measure', () => {
    const result = ReencodeEstimateSchema.parse({
      candidates: [],
      nowBytes: 0,
      afterBytes: 0,
      freeBytes: null,
      committedBytes: 0,
      awaitingReview: 0,
      awaitingReviewCap: 5,
    });

    expect(result.freeBytes).toBeNull();
  });
});

describe('ReencodeStartedSchema', () => {
  it('answers with what was taken on and what was turned away, and why', () => {
    const result = ReencodeStartedSchema.parse({
      started: [validReencode],
      refused: [
        { mediaId, refusal: { code: 'BeingWatched', detail: 'Somebody is watching it now.' } },
      ],
    });

    expect(result.started).toHaveLength(1);
    expect(result.refused[0]?.refusal.code).toBe('BeingWatched');
  });
});
