import { describe, expect, it } from 'vitest';
import {
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodingSettingsSchema,
  PreTranscodingStatusSchema,
} from './PreTranscoding';

describe('PreTranscodingSettingsSchema', () => {
  it('starts off, aiming at 1080p H.264 in MP4 overnight, which most devices play untouched', () => {
    expect(PRE_TRANSCODING_DEFAULTS).toEqual({
      isEnabled: false,
      isPaused: false,
      quality: '1080p',
      videoCodec: 'h264',
      container: 'mp4',
      maxBitrateKbps: null,
      audio: 'keep',
      libraryIds: null,
      schedule: 'window',
      windowStartHour: 1,
      windowEndHour: 6,
    });
  });

  it('offers the ladder from 4K down to 360p', () => {
    expect(PRE_TRANSCODE_QUALITIES).toEqual(['2160p', '1440p', '1080p', '720p', '480p', '360p']);
  });

  it('refuses an hour that is not on a clock', () => {
    expect(() => PreTranscodingSettingsSchema.parse({ windowStartHour: 24 })).toThrow();
  });

  it('refuses a rung below the ladder it offers', () => {
    expect(() => PreTranscodingSettingsSchema.parse({ quality: '144p' })).toThrow();
  });

  it('keeps a chosen set of libraries', () => {
    const libraryId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(PreTranscodingSettingsSchema.parse({ libraryIds: [libraryId] }).libraryIds).toEqual([
      libraryId,
    ]);
  });
});

describe('PreTranscodingStatusSchema', () => {
  it('accepts a status with nothing under way', () => {
    const result = PreTranscodingStatusSchema.parse({
      settings: PRE_TRANSCODING_DEFAULTS,
      copiesMade: 3,
      stillNeeded: 12,
      givenUp: 1,
      current: null,
      isInWindow: false,
      timezone: 'Europe/London',
    });

    expect(result.stillNeeded).toBe(12);
  });
});
