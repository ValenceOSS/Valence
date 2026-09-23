import { describe, expect, it } from 'vitest';
import { chapterTitleOf } from '@ValenceServer/books/chapterTitleOf';

describe('chapterTitleOf', () => {
  it('keeps a chapter’s own title', () => {
    expect(chapterTitleOf(' The Institute ', 3)).toBe('The Institute');
  });

  it('calls a chapter with no title, or only a number, by its place', () => {
    expect(chapterTitleOf('001', 0)).toBe('Chapter 1');
    expect(chapterTitleOf('', 4)).toBe('Chapter 5');
    expect(chapterTitleOf(null, 1)).toBe('Chapter 2');
  });
});
