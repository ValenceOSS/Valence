import { describe, expect, it } from 'vitest';
import { bucketCount } from './bucketCount';

describe('bucketCount', () => {
  it('says nothing is there for none, or for a number that is not one', () => {
    expect(bucketCount(0)).toBe('0');
    expect(bucketCount(-3)).toBe('0');
    expect(bucketCount(Number.NaN)).toBe('0');
  });

  it('puts each count in its band, at both edges', () => {
    expect(bucketCount(1)).toBe('1-9');
    expect(bucketCount(9)).toBe('1-9');
    expect(bucketCount(10)).toBe('10-99');
    expect(bucketCount(99)).toBe('10-99');
    expect(bucketCount(100)).toBe('100-999');
    expect(bucketCount(999)).toBe('100-999');
    expect(bucketCount(1000)).toBe('1000-9999');
    expect(bucketCount(9999)).toBe('1000-9999');
    expect(bucketCount(10_000)).toBe('10000+');
    expect(bucketCount(4_000_000)).toBe('10000+');
  });
});
