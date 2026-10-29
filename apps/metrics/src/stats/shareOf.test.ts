import { describe, expect, it } from 'vitest';
import { shareOf } from './shareOf';

const labelOf = (id: string) => id.toUpperCase();

describe('shareOf', () => {
  it('lists each group biggest first as a share of the whole', () => {
    expect(
      shareOf({
        counts: new Map([
          ['b', 3],
          ['a', 5],
        ]),
        total: 10,
        labelOf,
      }),
    ).toStrictEqual([
      { id: 'a', label: 'A', installs: 5, share: 0.5 },
      { id: 'b', label: 'B', installs: 3, share: 0.3 },
    ]);
  });

  it('folds every group of fewer than three installs into Other, last', () => {
    expect(
      shareOf({
        counts: new Map([
          ['rare', 1],
          ['common', 6],
          ['other', 1],
          ['scarce', 2],
        ]),
        total: 10,
        labelOf,
      }),
    ).toStrictEqual([
      { id: 'common', label: 'COMMON', installs: 6, share: 0.6 },
      { id: 'other', label: 'Other', installs: 4, share: 0.4 },
    ]);
  });

  it('keeps a natural order where one is given', () => {
    expect(
      shareOf({
        counts: new Map([
          ['large', 5],
          ['small', 3],
        ]),
        total: 8,
        labelOf,
        order: ['small', 'large'],
      }).map(({ id }) => id),
    ).toStrictEqual(['small', 'large']);
  });

  it('folds whatever is past the limit into Other', () => {
    expect(
      shareOf({
        counts: new Map([
          ['a', 5],
          ['b', 4],
          ['c', 3],
        ]),
        total: 12,
        labelOf,
        limit: 2,
      }).map(({ id, installs }) => [id, installs]),
    ).toStrictEqual([
      ['a', 5],
      ['b', 4],
      ['other', 3],
    ]);
  });

  it('breaks a tie by name, and leaves out empty groups', () => {
    expect(
      shareOf({
        counts: new Map([
          ['b', 3],
          ['a', 3],
          ['none', 0],
        ]),
        total: 6,
        labelOf,
      }).map(({ id }) => id),
    ).toStrictEqual(['a', 'b']);
  });

  it('says a share of nothing is nothing', () => {
    expect(shareOf({ counts: new Map([['a', 3]]), total: 0, labelOf })[0]?.share).toBe(0);
    expect(shareOf({ counts: new Map([['a', 1]]), total: 0, labelOf })[0]?.share).toBe(0);
  });
});
