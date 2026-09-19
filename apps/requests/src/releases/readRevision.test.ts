import { describe, expect, it } from 'vitest';
import { readRevision } from './readRevision';

describe('readRevision', () => {
  it('reads a proper, a real proper, a repack and a rerip', () => {
    expect(readRevision('Movie 2009 PROPER 720p')).toEqual({ isProper: true, isRepack: false });
    expect(readRevision('Movie REAL PROPER')).toEqual({ isProper: true, isRepack: false });
    expect(readRevision('Movie REPACK2 1080p')).toEqual({ isProper: false, isRepack: true });
    expect(readRevision('Movie RERIP')).toEqual({ isProper: false, isRepack: true });
    expect(readRevision('Movie 1080p')).toEqual({ isProper: false, isRepack: false });
  });
});
