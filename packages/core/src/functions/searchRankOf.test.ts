import { describe, expect, it } from 'vitest';
import { searchRankOf } from './searchRankOf';

describe('searchRankOf', () => {
  it('ranks an exact title first', () => {
    expect(searchRankOf(['Reacher'], 'reacher')).toBe(0);
  });

  it('ranks a title that starts with what was typed next', () => {
    expect(searchRankOf(['Reacher: The Series'], 'reacher')).toBe(1);
  });

  it('ranks a title with a word that starts with it after that', () => {
    expect(searchRankOf(['Jack Reacher'], 'reacher')).toBe(2);
  });

  it('ranks a title holding it anywhere after that', () => {
    expect(searchRankOf(['Preacher'], 'reacher')).toBe(3);
  });

  it('ranks a title that does not hold it at all last', () => {
    expect(searchRankOf(['The Night Agent'], 'reacher')).toBe(4);
  });

  it('takes the best of every name a title goes by', () => {
    expect(searchRankOf(['Episode 1', 'Reacher'], 'reacher')).toBe(0);
  });

  it('ignores case, accents and extra spaces', () => {
    expect(searchRankOf(['Amélie'], '  AMELIE ')).toBe(0);
    expect(searchRankOf(['The Office'], 'the   office')).toBe(0);
  });

  it('passes over a missing name', () => {
    expect(searchRankOf([null, undefined, 'Reacher'], 'reacher')).toBe(0);
  });

  it('ranks nothing as a match for an empty search', () => {
    expect(searchRankOf(['Reacher'], '   ')).toBe(4);
  });
});
