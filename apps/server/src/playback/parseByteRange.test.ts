import { describe, expect, it } from 'vitest';
import { parseByteRange } from './parseByteRange';

describe('parseByteRange', () => {
  it('reads an open range to the end of the file', () => {
    expect(parseByteRange('bytes=100-', 1000)).toEqual({ start: 100, end: 999 });
  });

  it('reads a closed range, stopping at the last byte', () => {
    expect(parseByteRange('bytes=0-499', 1000)).toEqual({ start: 0, end: 499 });
    expect(parseByteRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('reads a range counted back from the end', () => {
    expect(parseByteRange('bytes=-200', 1000)).toEqual({ start: 800, end: 999 });
    expect(parseByteRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('sends the whole file for what it cannot serve as one range', () => {
    expect(parseByteRange('bytes=0-1,5-6', 1000)).toBeNull();
    expect(parseByteRange('bytes=2000-', 1000)).toBeNull();
    expect(parseByteRange('bytes=500-100', 1000)).toBeNull();
    expect(parseByteRange('items=0-1', 1000)).toBeNull();
    expect(parseByteRange('bytes=-', 1000)).toBeNull();
    expect(parseByteRange('bytes=0-', 0)).toBeNull();
  });
});
