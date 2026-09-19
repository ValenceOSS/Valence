import { describe, expect, it } from 'vitest';
import { queryTitleOf } from './queryTitleOf';

describe('queryTitleOf', () => {
  it('drops the dashes that would leave words out of a search', () => {
    expect(queryTitleOf('Re:ZERO -Starting Life in Another World-')).toBe(
      'Re:ZERO Starting Life in Another World',
    );
    expect(queryTitleOf('Mission: Impossible – Dead Reckoning')).toBe(
      'Mission: Impossible Dead Reckoning',
    );
  });

  it('drops quotes, bars and brackets, and keeps dashes inside a word', () => {
    expect(queryTitleOf('"Spider-Man" | (Homecoming)')).toBe('Spider-Man Homecoming');
    expect(queryTitleOf('Dune')).toBe('Dune');
  });
});
