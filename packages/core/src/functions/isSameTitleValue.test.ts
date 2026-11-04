import { describe, expect, it } from 'vitest';
import { isSameTitleValue } from './isSameTitleValue';

describe('isSameTitleValue', () => {
  it('compares words, numbers and nothing as they are', () => {
    expect(isSameTitleValue('A film', 'A film')).toBe(true);
    expect(isSameTitleValue('A film', 'Another')).toBe(false);
    expect(isSameTitleValue(7, 7)).toBe(true);
    expect(isSameTitleValue(null, '')).toBe(false);
    expect(isSameTitleValue(null, null)).toBe(true);
  });

  it('compares lists word for word, in order', () => {
    expect(isSameTitleValue(['Drama', 'War'], ['Drama', 'War'])).toBe(true);
    expect(isSameTitleValue(['Drama', 'War'], ['War', 'Drama'])).toBe(false);
    expect(isSameTitleValue(['Drama'], 'Drama')).toBe(false);
  });

  it('compares content ratings whatever order their countries came in', () => {
    expect(isSameTitleValue({ GB: '15', US: 'R' }, { US: 'R', GB: '15' })).toBe(true);
    expect(isSameTitleValue({ GB: '15' }, { GB: '12' })).toBe(false);
    expect(isSameTitleValue({ GB: '15' }, { GB: '15', US: 'R' })).toBe(false);
    expect(isSameTitleValue({ GB: '15' }, ['15'])).toBe(false);
  });
});
