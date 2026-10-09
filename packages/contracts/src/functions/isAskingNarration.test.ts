import { describe, expect, it } from 'vitest';
import { isAskingNarration } from './isAskingNarration';

const TWO = [
  { asin: 'A', narrators: ['One'], runtimeMinutes: 600, series: null },
  { asin: 'B', narrators: ['Two'], runtimeMinutes: 610, series: null },
];

describe('isAskingNarration', () => {
  it('asks only for an audiobook out in more than one narration, none chosen yet', () => {
    const book = { kind: 'book' as const, bookFormats: ['audiobook' as const], narrations: TWO };

    expect(isAskingNarration(book)).toBe(true);
    expect(isAskingNarration({ ...book, narrationsWanted: ['A'] })).toBe(false);
    expect(isAskingNarration({ ...book, narrations: TWO.slice(0, 1) })).toBe(false);
    expect(isAskingNarration({ ...book, bookFormats: ['ebook'] })).toBe(false);
    expect(isAskingNarration({ ...book, kind: 'film' })).toBe(false);
  });
});
