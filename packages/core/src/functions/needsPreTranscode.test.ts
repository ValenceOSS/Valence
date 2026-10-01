import { describe, expect, it } from 'vitest';
import { needsPreTranscode } from './needsPreTranscode';
import type { PreTranscodeTarget } from './needsPreTranscode';

const target: PreTranscodeTarget = { quality: '1080p', videoCodec: 'h264', maxBitrateKbps: null };

const film = { height: 1080, bitrateKbps: 4000, videoCodec: 'h264', videoFrameRate: 24 };

describe('needsPreTranscode', () => {
  it('wants a copy of a picture taller than the target', () => {
    expect(needsPreTranscode({ ...film, height: 2160, bitrateKbps: 40000 }, target)).toBe(true);
  });

  it('wants a copy of a picture at the target that spends more than the rung allows', () => {
    expect(needsPreTranscode({ ...film, bitrateKbps: 20000 }, target)).toBe(true);
  });

  it('leaves alone a file already at the target in the same codec', () => {
    expect(needsPreTranscode(film, target)).toBe(false);
  });

  it('never makes a copy larger than the original', () => {
    expect(needsPreTranscode({ ...film, height: 720, bitrateKbps: 2000 }, target)).toBe(false);
  });

  it('wants a copy where the original spends more than the ceiling somebody named', () => {
    expect(needsPreTranscode(film, { ...target, maxBitrateKbps: 3000 })).toBe(true);
  });

  it('wants an H.264 copy of an HEVC file, which fewer devices decode', () => {
    expect(needsPreTranscode({ ...film, videoCodec: 'hevc' }, target)).toBe(true);
  });

  it('does not trade H.264 for HEVC at the same picture, which helps no device', () => {
    expect(needsPreTranscode(film, { ...target, videoCodec: 'hevc' })).toBe(false);
  });

  it('trades an old codec for a modern one', () => {
    expect(
      needsPreTranscode({ ...film, videoCodec: 'mpeg2video' }, { ...target, videoCodec: 'hevc' }),
    ).toBe(true);
  });
});
