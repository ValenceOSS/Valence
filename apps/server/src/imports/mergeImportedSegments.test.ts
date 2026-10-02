import { describe, expect, it } from 'vitest';
import { mergeImportedSegments } from './mergeImportedSegments';

describe('mergeImportedSegments', () => {
  it('replaces what Valence found for itself, but never what somebody set by hand', () => {
    expect(
      mergeImportedSegments(
        [
          { kind: 'intro', startSeconds: 10, endSeconds: 40, source: 'fingerprint' },
          { kind: 'credits', startSeconds: 100, endSeconds: 120, source: 'manual' },
          { kind: 'recap', startSeconds: 0, endSeconds: 5, source: 'fingerprint' },
        ],
        [
          { kind: 'intro', startSeconds: -1, endSeconds: 45 },
          { kind: 'credits', startSeconds: 90, endSeconds: 120 },
        ],
      ),
    ).toEqual([
      { kind: 'intro', startSeconds: 0, endSeconds: 45, source: 'imported' },
      { kind: 'credits', startSeconds: 100, endSeconds: 120, source: 'manual' },
      { kind: 'recap', startSeconds: 0, endSeconds: 5, source: 'fingerprint' },
    ]);
  });

  it('changes nothing where the same markers were imported before', () => {
    expect(
      mergeImportedSegments(
        [{ kind: 'intro', startSeconds: 0, endSeconds: 45, source: 'imported' }],
        [{ kind: 'intro', startSeconds: 0, endSeconds: 45 }],
      ),
    ).toBeNull();
  });

  it('adds a kind Valence did not have', () => {
    expect(
      mergeImportedSegments([], [{ kind: 'credits', startSeconds: 1, endSeconds: 2 }]),
    ).toEqual([{ kind: 'credits', startSeconds: 1, endSeconds: 2, source: 'imported' }]);
  });
});
