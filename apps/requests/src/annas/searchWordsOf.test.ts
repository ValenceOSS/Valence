import { describe, expect, it } from 'vitest';
import { searchWordsOf } from './searchWordsOf';

describe('searchWordsOf', () => {
  it('puts words alike, whatever case, punctuation or width they were written in', () => {
    expect(searchWordsOf('The Eye of the World: Book 1 — Robert Jordan')).toBe(
      'the eye of the world book 1 robert jordan',
    );
    expect(searchWordsOf('薫る花は凛と咲く　１')).toBe('薫る花は凛と咲く 1');
  });
});
