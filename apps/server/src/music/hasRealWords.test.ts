import { describe, expect, it } from 'vitest';
import { hasRealWords } from './hasRealWords';

describe('hasRealWords', () => {
  it('takes a song’s words as words', () => {
    expect(hasRealWords('Out from underneath who you were\nCome on, come on')).toBe(true);
    expect(hasRealWords('[00:01.00]Out from underneath who you were')).toBe(true);
  });

  it('takes a ripper’s web address as no words at all', () => {
    expect(hasRealWords('www.t.me/pmedia_music')).toBe(false);
    expect(hasRealWords('[00:00.00]https://example.com\n\n')).toBe(false);
  });

  it('takes nothing but space as no words', () => {
    expect(hasRealWords(' \n ')).toBe(false);
  });

  it('keeps words that mention a site among other lines', () => {
    expect(hasRealWords('Visit www.example.com\nAnd then we sang')).toBe(true);
  });
});
