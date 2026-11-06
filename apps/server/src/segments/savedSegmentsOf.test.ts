import { describe, expect, it } from 'vitest';
import { savedSegmentsOf } from './savedSegmentsOf';

const CREDITS = {
  kind: 'credits' as const,
  startSeconds: 5414.646,
  endSeconds: 5903.904,
  source: 'fingerprint' as const,
};

describe('savedSegmentsOf', () => {
  it('keeps a found marker saved as it was shown, and makes a moved or new one a person’s', () => {
    expect(
      savedSegmentsOf(
        [CREDITS],
        [
          { kind: 'credits', startSeconds: 5414, endSeconds: 5903 },
          { kind: 'intro', startSeconds: 10, endSeconds: 70 },
        ],
      ),
    ).toEqual([CREDITS, { kind: 'intro', startSeconds: 10, endSeconds: 70, source: 'manual' }]);
    expect(
      savedSegmentsOf([CREDITS], [{ kind: 'credits', startSeconds: 5400, endSeconds: 5903 }]),
    ).toEqual([{ kind: 'credits', startSeconds: 5400, endSeconds: 5903, source: 'manual' }]);
  });
});
