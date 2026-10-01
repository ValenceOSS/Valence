import { describe, expect, it } from 'vitest';
import { readBitrate } from './readBitrate';

describe('readBitrate', () => {
  it('reads nothing typed as no ceiling', () => {
    expect(readBitrate('  ')).toEqual({ kind: 'none' });
  });

  it('reads a whole number of kilobits within reason', () => {
    expect(readBitrate('3000')).toEqual({ kind: 'kbps', kbps: 3000 });
  });

  it('refuses a ceiling too low to be a picture, a fraction, or words', () => {
    expect([readBitrate('20'), readBitrate('2500.5'), readBitrate('fast')]).toEqual([
      { kind: 'invalid' },
      { kind: 'invalid' },
      { kind: 'invalid' },
    ]);
  });
});
