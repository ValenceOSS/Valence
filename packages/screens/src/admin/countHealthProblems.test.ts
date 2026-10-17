import { describe, expect, it } from 'vitest';
import { countHealthProblems } from './countHealthProblems';

const list = (total: number) => ({ total, items: [] });

describe('countHealthProblems', () => {
  it('adds up every kind of problem', () => {
    expect(
      countHealthProblems({
        checkedAt: '2026-10-17T00:00:00.000Z',
        unmatched: list(3),
        noArtwork: list(1),
        duplicate: list(2),
        unreadable: list(0),
      }),
    ).toBe(6);
  });

  it('counts nothing before the libraries have been read', () => {
    expect(countHealthProblems(null)).toBe(0);
  });
});
