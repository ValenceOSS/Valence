import { describe, expect, it } from 'vitest';
import { channelsOf } from './channelsOf';

describe('channelsOf', () => {
  it('reads a hex code, long or short', () => {
    expect(channelsOf('#1e90ff')).toEqual([30, 144, 255]);
    expect(channelsOf('#fff')).toEqual([255, 255, 255]);
  });

  it('reads rgb() and rgba()', () => {
    expect(channelsOf('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
    expect(channelsOf('rgba(10, 20, 30, 0.5)')).toEqual([10, 20, 30]);
  });

  it('gives nothing for a colour it cannot read', () => {
    expect(channelsOf('tomato')).toBeNull();
  });
});
