import { describe, expect, it } from 'vitest';
import { findBranchesToPrune } from './findBranchesToPrune';

describe('findBranchesToPrune', () => {
  it('takes a branch still at the commit its pull request merged at', () => {
    expect(
      findBranchesToPrune(
        [{ name: 'feat/done', commit: 'a1' }],
        [{ branch: 'feat/done', commit: 'a1', state: 'MERGED' }],
      ),
    ).toEqual(['feat/done']);
  });

  it('keeps a branch that moved on after its merge, since that work was never merged', () => {
    expect(
      findBranchesToPrune(
        [{ name: 'feat/more', commit: 'b2' }],
        [{ branch: 'feat/more', commit: 'b1', state: 'MERGED' }],
      ),
    ).toEqual([]);
  });

  it('keeps a branch with a pull request still open, even if an earlier one merged', () => {
    expect(
      findBranchesToPrune(
        [{ name: 'release', commit: 'c1' }],
        [
          { branch: 'release', commit: 'c1', state: 'MERGED' },
          { branch: 'release', commit: 'c1', state: 'OPEN' },
        ],
      ),
    ).toEqual([]);
  });

  it('keeps a branch whose pull request was closed without merging, or that never had one', () => {
    expect(
      findBranchesToPrune(
        [
          { name: 'feat/declined', commit: 'd1' },
          { name: 'feat/untouched', commit: 'e1' },
        ],
        [{ branch: 'feat/declined', commit: 'd1', state: 'CLOSED' }],
      ),
    ).toEqual([]);
  });

  it('never takes the trunk or the branch checked out here', () => {
    expect(
      findBranchesToPrune(
        [
          { name: 'main', commit: 'f1' },
          { name: 'feat/here', commit: 'g1' },
        ],
        [
          { branch: 'main', commit: 'f1', state: 'MERGED' },
          { branch: 'feat/here', commit: 'g1', state: 'MERGED' },
        ],
        'feat/here',
      ),
    ).toEqual([]);
  });

  it('sorts what it finds', () => {
    expect(
      findBranchesToPrune(
        [
          { name: 'fix/b', commit: '2' },
          { name: 'feat/a', commit: '1' },
        ],
        [
          { branch: 'fix/b', commit: '2', state: 'MERGED' },
          { branch: 'feat/a', commit: '1', state: 'MERGED' },
        ],
      ),
    ).toEqual(['feat/a', 'fix/b']);
  });
});
