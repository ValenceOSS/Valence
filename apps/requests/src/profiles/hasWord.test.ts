import { describe, expect, it } from 'vitest';
import { hasWord } from './hasWord';

describe('hasWord', () => {
  it('finds a whole word, whatever its case', () => {
    expect(hasWord('Movie.2023.1080p.HDR.x265', 'hdr')).toBe(true);
    expect(hasWord('Movie.2023.1080p.HDR10.x265', 'hdr')).toBe(false);
    expect(hasWord('Movie 2023 DD+ 5.1', 'DD+')).toBe(true);
  });

  it('matches a pattern between slashes, and nothing for a broken one', () => {
    expect(hasWord('Movie.2023.1080p.HDR10.x265', '/hdr10\\+?/')).toBe(true);
    expect(hasWord('Movie', '/[/')).toBe(false);
  });

  it('gives up on a pattern that repeats a repeat', () => {
    const started = Date.now();

    expect(hasWord(`${'a'.repeat(60)}!`, '/^(a+)+$/')).toBe(false);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('looks only at the start of a very long name', () => {
    expect(hasWord(`${'x'.repeat(1_000_000)} hdr`, 'hdr')).toBe(false);
  });
});
