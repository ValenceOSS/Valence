import { describe, expect, it } from 'vitest';
import { readHdr } from './readHdr';

describe('readHdr', () => {
  it('reads Dolby Vision with HDR10+, without also calling it HDR10', () => {
    expect(readHdr('Movie 2160p DV HDR10+ HEVC')).toEqual(['dolbyVision', 'hdr10plus']);
    expect(readHdr('Movie 2160p HDR10Plus')).toEqual(['hdr10plus']);
  });

  it('takes plain HDR for HDR10, and reads HLG and Dolby Vision spelled out', () => {
    expect(readHdr('Movie 2160p HDR')).toEqual(['hdr10']);
    expect(readHdr('Movie 2160p Dolby Vision HLG')).toEqual(['dolbyVision', 'hlg']);
  });

  it('reads nothing into SDR', () => {
    expect(readHdr('Movie 2160p SDR')).toEqual([]);
  });
});
