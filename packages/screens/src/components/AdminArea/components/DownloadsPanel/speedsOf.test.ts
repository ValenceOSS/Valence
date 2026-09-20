import { describe, expect, it } from 'vitest';
import { speedsOf } from './speedsOf';

describe('speedsOf', () => {
  it('says each direction that is known', () => {
    expect(speedsOf(1_258_291, 40_960)).toEqual(['↓ 1.2 MB/s', '↑ 40 KB/s']);
    expect(speedsOf(2048, null)).toEqual(['↓ 2.0 KB/s']);
    expect(speedsOf(null, null)).toEqual([]);
  });
});
