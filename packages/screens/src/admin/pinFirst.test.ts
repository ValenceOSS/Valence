import { describe, expect, it } from 'vitest';
import { pinFirst } from './pinFirst';

const ROWS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

const ids = (rows: readonly { id: string }[]) => rows.map((row) => row.id);

describe('pinFirst', () => {
  it('puts the pinned ones first, each group keeping its own order', () => {
    expect(ids(pinFirst(ROWS, new Set(['c', 'a']), (row) => row.id))).toStrictEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
  });

  it('leaves the order as it was where nothing is pinned', () => {
    expect(ids(pinFirst(ROWS, new Set(), (row) => row.id))).toStrictEqual(['a', 'b', 'c', 'd']);
  });

  it('ignores a pin on something that is not there', () => {
    expect(ids(pinFirst(ROWS, new Set(['zzz']), (row) => row.id))).toStrictEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('does not change what it was given', () => {
    const before = [...ROWS];

    pinFirst(ROWS, new Set(['d']), (row) => row.id);

    expect(ROWS).toStrictEqual(before);
  });
});
