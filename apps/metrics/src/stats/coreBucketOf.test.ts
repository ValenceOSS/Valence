import { describe, expect, it } from 'vitest';
import { coreBucketOf } from './coreBucketOf';

describe('coreBucketOf', () => {
  it.each([
    [1, '1-2'],
    [2, '1-2'],
    [4, '3-4'],
    [6, '5-8'],
    [16, '9-16'],
    [24, '17-32'],
    [64, '33-64'],
    [65, '65+'],
    [256, '65+'],
  ] as const)('puts %d cores in %s', (cores, bucket) => {
    expect(coreBucketOf(cores)).toBe(bucket);
  });
});
