import { describe, expect, it } from 'vitest';
import { bucketMemoryGb } from './bucketMemoryGb';

const GIGABYTE = 1024 ** 3;

describe('bucketMemoryGb', () => {
  it('puts a small machine under four', () => {
    expect(bucketMemoryGb(2 * GIGABYTE)).toBe('<4');
    expect(bucketMemoryGb(0)).toBe('<4');
  });

  it('counts a machine that reports a little under its size as that size', () => {
    expect(bucketMemoryGb(15.6 * GIGABYTE)).toBe('16-32');
    expect(bucketMemoryGb(7.7 * GIGABYTE)).toBe('8-16');
    expect(bucketMemoryGb(62.8 * GIGABYTE)).toBe('64-128');
    expect(bucketMemoryGb(3.8 * GIGABYTE)).toBe('4-8');
  });

  it('puts each size in its band', () => {
    expect(bucketMemoryGb(4 * GIGABYTE)).toBe('4-8');
    expect(bucketMemoryGb(32 * GIGABYTE)).toBe('32-64');
    expect(bucketMemoryGb(64 * GIGABYTE)).toBe('64-128');
    expect(bucketMemoryGb(128 * GIGABYTE)).toBe('128+');
    expect(bucketMemoryGb(512 * GIGABYTE)).toBe('128+');
  });
});
