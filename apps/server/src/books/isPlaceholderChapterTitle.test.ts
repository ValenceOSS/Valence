import { describe, expect, it } from 'vitest';
import { isPlaceholderChapterTitle } from './isPlaceholderChapterTitle';

describe('isPlaceholderChapterTitle', () => {
  it('counts a title with nothing but its number as a placeholder', () => {
    expect(isPlaceholderChapterTitle('', [])).toBe(true);
    expect(isPlaceholderChapterTitle('012', [])).toBe(true);
    expect(isPlaceholderChapterTitle('Chapter 12', [])).toBe(true);
    expect(isPlaceholderChapterTitle('Ch. 12.5', [])).toBe(true);
    expect(isPlaceholderChapterTitle('c012', [])).toBe(true);
  });

  it('counts the book or series name as a placeholder', () => {
    expect(isPlaceholderChapterTitle('Rent-A-Girlfriend', ['Rent A Girlfriend'])).toBe(true);
  });

  it('keeps a title of its own', () => {
    expect(isPlaceholderChapterTitle('The Girlfriend and the Lie', ['Rent-A-Girlfriend'])).toBe(
      false,
    );
    expect(isPlaceholderChapterTitle('Chapter 12: A Date', [])).toBe(false);
  });
});
