import { describe, expect, it } from 'vitest';
import { renditionLabel } from './renditionLabel';

describe('renditionLabel', () => {
  it('names the rung and the codec, which is what decides whether a device plays it', () => {
    expect(renditionLabel({ width: 1920, height: 1080, videoCodec: 'hevc' })).toBe('1080p HEVC');
  });

  it('calls the largest rung what everybody calls it', () => {
    expect(renditionLabel({ width: 3840, height: 2160, videoCodec: 'av1' })).toBe('4K AV1');
  });

  it('reads a scope film by its width, since its height falls short of its class', () => {
    expect(renditionLabel({ width: 1920, height: 800, videoCodec: 'h264' })).toBe('1080p H.264');
  });

  it('writes a codec nobody listed as it arrived, rather than dropping it', () => {
    expect(renditionLabel({ width: 1280, height: 720, videoCodec: 'theora' })).toBe('720p THEORA');
  });

  it('falls back to the codec alone for a picture smaller than every rung', () => {
    expect(renditionLabel({ width: 160, height: 90, videoCodec: 'h264' })).toBe('H.264');
  });
});
