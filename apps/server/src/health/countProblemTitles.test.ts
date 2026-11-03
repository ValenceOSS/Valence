import { describe, expect, it } from 'vitest';
import { countProblemTitles } from './countProblemTitles';

describe('countProblemTitles', () => {
  it('counts a series once however many of its episodes have problems', () => {
    expect(
      countProblemTitles([
        { id: 'e1', seriesId: 's' },
        { id: 'e2', seriesId: 's' },
        { id: 'e3', seriesId: 's' },
        { id: 'e4', seriesId: 's' },
      ]),
    ).toBe(1);
  });

  it('counts an unmatched series and a problem episode of it as the same title', () => {
    expect(
      countProblemTitles([
        { id: 's', seriesId: null },
        { id: 'e1', seriesId: 's' },
      ]),
    ).toBe(1);
  });

  it('counts a film with two problems once, and each film on its own', () => {
    expect(
      countProblemTitles([
        { id: 'f1', seriesId: null },
        { id: 'f1', seriesId: null },
        { id: 'f2', seriesId: null },
      ]),
    ).toBe(2);
  });
});
