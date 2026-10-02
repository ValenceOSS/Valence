import { describe, expect, it } from 'vitest';
import { termAsWord } from './termAsWord';

describe('termAsWord', () => {
  it('keeps a plain word as it is', () => {
    expect(termAsWord(' REPACK ', false)).toBe('REPACK');
    expect(termAsWord('', false)).toBeNull();
  });

  it('spells out a pattern that only spells a word', () => {
    expect(termAsWord('\\bRepack\\b', true)).toBe('Repack');
    expect(termAsWord('(?i)\\bDD\\+\\b', true)).toBe('DD+');
    expect(termAsWord('/\\bWEB\\-DL\\b/i', false)).toBe('WEB-DL');
  });

  it('keeps a pattern that does more between slashes', () => {
    expect(termAsWord('[xh][ ._-]?265|\\bHEVC(\\b|\\d)', true)).toBe(
      '/[xh][ ._-]?265|\\bHEVC(\\b|\\d)/',
    );
    expect(termAsWord('/\\b(amzn|amazon)\\b/i', false)).toBe('/\\b(amzn|amazon)\\b/');
  });

  it('has none for a pattern JavaScript cannot read or one too long to keep', () => {
    expect(termAsWord('(unclosed', true)).toBeNull();
    expect(termAsWord(`(${'a|'.repeat(60)}b)`, true)).toBeNull();
  });
});
