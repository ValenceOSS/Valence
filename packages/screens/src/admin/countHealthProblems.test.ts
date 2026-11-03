import { describe, expect, it } from 'vitest';
import { countHealthProblems } from './countHealthProblems';

const NOTHING = { total: 0, items: [] };

describe('countHealthProblems', () => {
  it('counts each title with something wrong once, not each file', () => {
    expect(
      countHealthProblems({
        checkedAt: '2026-10-17T00:00:00.000Z',
        titles: 1,
        unmatched: NOTHING,
        noArtwork: NOTHING,
        duplicate: { total: 4, items: [] },
        unreadable: NOTHING,
      }),
    ).toBe(1);
  });

  it('counts every problem where an answer kept from before the upgrade has no title count', () => {
    expect(
      countHealthProblems({
        checkedAt: '2026-10-17T00:00:00.000Z',
        unmatched: { total: 2, items: [] },
        noArtwork: NOTHING,
        duplicate: { total: 1, items: [] },
        unreadable: NOTHING,
      }),
    ).toBe(3);
  });

  it('counts nothing before the health has been read', () => {
    expect(countHealthProblems(null)).toBe(0);
  });
});
