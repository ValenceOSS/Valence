import { describe, expect, it } from 'vitest';
import { describeStreamLimit } from './describeStreamLimit';

describe('describeStreamLimit', () => {
  it('says how many streams are running out of how many, and the bitrate held to', () => {
    expect(describeStreamLimit({ limit: { maxBitrateKbps: 8000, maxStreams: 3 }, now: 2 })).toBe(
      '2 of 3 streams · Up to 8 Mbps',
    );
  });

  it('says only what is limited', () => {
    expect(describeStreamLimit({ limit: { maxBitrateKbps: null, maxStreams: 1 }, now: 1 })).toBe(
      '1 of 1 streams',
    );
  });

  it('says nothing for an account nobody limited', () => {
    expect(
      describeStreamLimit({ limit: { maxBitrateKbps: null, maxStreams: null }, now: 4 }),
    ).toBeNull();
    expect(describeStreamLimit(null)).toBeNull();
  });
});
