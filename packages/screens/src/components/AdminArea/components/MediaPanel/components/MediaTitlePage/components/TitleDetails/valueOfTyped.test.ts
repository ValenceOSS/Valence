import { describe, expect, it } from 'vitest';
import { valueOfTyped } from './valueOfTyped';

describe('valueOfTyped', () => {
  it('reads a score as a number, and nothing typed as no score', () => {
    expect(valueOfTyped('rating', ' 7.5 ')).toBe(7.5);
    expect(valueOfTyped('rating', '')).toBeNull();
  });

  it('reads a trailer from a YouTube link, or as the video ID typed', () => {
    expect(valueOfTyped('trailer', 'https://www.youtube.com/watch?v=abcdefghijk&t=3')).toBe(
      'abcdefghijk',
    );
    expect(valueOfTyped('trailer', 'https://youtu.be/abcdefghijk')).toBe('abcdefghijk');
    expect(valueOfTyped('trailer', 'abcdefghijk')).toBe('abcdefghijk');
    expect(valueOfTyped('trailer', ' ')).toBeNull();
  });

  it('reads an emptied field as nothing, but keeps an emptied title as typed', () => {
    expect(valueOfTyped('tagline', '  ')).toBeNull();
    expect(valueOfTyped('title', '')).toBe('');
  });
});
