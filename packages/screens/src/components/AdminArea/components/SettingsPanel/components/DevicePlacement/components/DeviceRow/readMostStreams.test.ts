import { describe, expect, it } from 'vitest';
import { readMostStreams } from './readMostStreams';

describe('readMostStreams', () => {
  it('reads a number of streams', () => {
    expect(readMostStreams('4')).toBe(4);
    expect(readMostStreams(' 12 ')).toBe(12);
  });

  it('reads an empty field as no limit of its own', () => {
    expect(readMostStreams('')).toBeNull();
  });

  it('refuses what is not a number of streams', () => {
    expect(readMostStreams('0')).toBeUndefined();
    expect(readMostStreams('2.5')).toBeUndefined();
    expect(readMostStreams('65')).toBeUndefined();
    expect(readMostStreams('lots')).toBeUndefined();
  });
});
