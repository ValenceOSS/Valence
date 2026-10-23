import { describe, expect, it } from 'vitest';
import { segmentAt } from './segmentAt';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

const SEGMENTS: MediaSegment[] = [
  { kind: 'intro', startSeconds: 60, endSeconds: 120, source: 'fingerprint' },
  { kind: 'credits', startSeconds: 1700, endSeconds: 1800, source: 'imported' },
];

describe('segmentAt', () => {
  it('finds the stretch a moment falls in', () => {
    expect(segmentAt(SEGMENTS, 90)?.kind).toBe('intro');
    expect(segmentAt(SEGMENTS, 1700)?.kind).toBe('credits');
  });

  it('finds nothing between stretches, or at the moment one ends', () => {
    expect(segmentAt(SEGMENTS, 400)).toBeNull();
    expect(segmentAt(SEGMENTS, 120)).toBeNull();
  });
});
