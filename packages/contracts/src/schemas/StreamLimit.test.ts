import { describe, expect, it } from 'vitest';
import { NO_STREAM_LIMIT, StreamLimitSchema, StreamLimitsSchema } from './StreamLimit';

describe('StreamLimitSchema', () => {
  it('reads a limit with either side left open', () => {
    expect(StreamLimitSchema.parse({ maxBitrateKbps: 8000 })).toEqual({
      maxBitrateKbps: 8000,
      maxStreams: null,
    });
    expect(StreamLimitSchema.parse({})).toEqual(NO_STREAM_LIMIT);
  });

  it('refuses a ceiling nothing could be played under', () => {
    expect(StreamLimitSchema.safeParse({ maxBitrateKbps: 10 }).success).toBe(false);
    expect(StreamLimitSchema.safeParse({ maxStreams: 0 }).success).toBe(false);
  });
});

describe('StreamLimitsSchema', () => {
  it('starts with nobody limited', () => {
    expect(StreamLimitsSchema.parse({})).toEqual({ accounts: {}, roles: {} });
  });
});
