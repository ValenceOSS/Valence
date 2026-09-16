import { describe, expect, it } from 'vitest';
import { ResourceSampleQuerySchema, sinceMsForRange } from './ResourceSample';

describe('sinceMsForRange', () => {
  it('reaches back a day for the shortest range', () => {
    expect(sinceMsForRange('24h', 100_000_000)).toBe(100_000_000 - 86_400_000);
  });

  it('reaches back three times as far for three days as for one', () => {
    const now = 1_000_000_000;

    expect(now - sinceMsForRange('3d', now)).toBe(3 * (now - sinceMsForRange('24h', now)));
  });

  it('reaches back a week for the longest range', () => {
    const now = 1_000_000_000;

    expect(now - sinceMsForRange('7d', now)).toBe(7 * 86_400_000);
  });
});

describe('ResourceSampleQuerySchema', () => {
  it('shows the last day when nothing is asked for', () => {
    expect(ResourceSampleQuerySchema.parse({}).range).toBe('24h');
  });

  it('refuses a range it does not know', () => {
    expect(ResourceSampleQuerySchema.safeParse({ range: 'forever' }).success).toBe(false);
  });
});
