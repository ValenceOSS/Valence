import { describe, expect, it } from 'vitest';
import { nameOfChapter } from './nameOfChapter';

describe('nameOfChapter', () => {
  it('uses the name the file gives', () => {
    expect(nameOfChapter({ title: 'Opening', startSeconds: 0, endSeconds: 9 }, 1)).toBe('Opening');
  });

  it('numbers a chapter the file left unnamed', () => {
    expect(nameOfChapter({ title: null, startSeconds: 0, endSeconds: 9 }, 3)).toBe('Chapter 3');
    expect(nameOfChapter({ title: '  ', startSeconds: 0, endSeconds: 9 }, 4)).toBe('Chapter 4');
  });
});
