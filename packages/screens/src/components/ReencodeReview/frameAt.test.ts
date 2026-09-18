import { describe, expect, it } from 'vitest';
import { frameAt } from './frameAt';

describe('frameAt', () => {
  it('names which of the two files it wants', () => {
    expect(frameAt('abc', 'original', 100)).toContain('side=original');
    expect(frameAt('abc', 'encode', 100)).toContain('side=encode');
  });

  it('asks the re-encode rather than a path, since neither file is where it was', () => {
    expect(frameAt('abc', 'encode', 100).startsWith('/api/reencodes/abc/frame')).toBe(true);
  });

  it('asks for a whole second, because a frame address is also a cache key', () => {
    expect(frameAt('abc', 'encode', 100.7)).toContain('seconds=100');
  });

  it('never asks for a moment before the beginning', () => {
    expect(frameAt('abc', 'encode', -5)).toContain('seconds=0');
  });

  it('asks for a width worth comparing at', () => {
    expect(frameAt('abc', 'encode', 0)).toContain('width=960');
  });
});
