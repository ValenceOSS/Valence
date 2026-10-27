import { describe, expect, it } from 'vitest';
import { indexLikeness } from './indexLikeness';

const NOTHING_ALIKE = { genres: [], keywords: [], cast: [], crew: [], recommendations: [] };

describe('gathering what every title is like', () => {
  it('reads a programme’s broader genres as the film genres they join', () => {
    const index = indexLikeness([
      {
        kind: 'series',
        catalogueId: '1',
        likeness: { ...NOTHING_ALIKE, genres: [10765, 18] },
      },
    ]);

    expect([...(index.titles.get('series:1')?.genres ?? [])]).toEqual([878, 14, 18]);
  });

  it('weighs a keyword more the fewer titles carry it', () => {
    const index = indexLikeness([
      { kind: 'film', catalogueId: '1', likeness: { ...NOTHING_ALIKE, keywords: [7, 8] } },
      { kind: 'film', catalogueId: '2', likeness: { ...NOTHING_ALIKE, keywords: [7] } },
      { kind: 'film', catalogueId: '3', likeness: { ...NOTHING_ALIKE, keywords: [7] } },
    ]);

    expect(index.keywordWeight(8)).toBeGreaterThan(index.keywordWeight(7));
  });

  it('counts a keyword a title names twice once', () => {
    const once = indexLikeness([
      { kind: 'film', catalogueId: '1', likeness: { ...NOTHING_ALIKE, keywords: [7] } },
      { kind: 'film', catalogueId: '2', likeness: NOTHING_ALIKE },
    ]);
    const twice = indexLikeness([
      { kind: 'film', catalogueId: '1', likeness: { ...NOTHING_ALIKE, keywords: [7, 7] } },
      { kind: 'film', catalogueId: '2', likeness: NOTHING_ALIKE },
    ]);

    expect(twice.keywordWeight(7)).toBe(once.keywordWeight(7));
  });
});
