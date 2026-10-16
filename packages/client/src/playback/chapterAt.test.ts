import { describe, expect, it } from 'vitest';
import { chapterAt } from './chapterAt';

const OPENING = { title: 'Opening', startSeconds: 0, endSeconds: 90 };
const MIDDLE = { title: null, startSeconds: 90, endSeconds: 600 };

describe('chapterAt', () => {
  it('finds the chapter a moment falls in, counting from one', () => {
    expect(chapterAt([OPENING, MIDDLE], 30)).toEqual({ chapter: OPENING, number: 1 });
    expect(chapterAt([OPENING, MIDDLE], 90)).toEqual({ chapter: MIDDLE, number: 2 });
  });

  it('names none where the file marks only one', () => {
    expect(chapterAt([OPENING], 30)).toBeNull();
  });

  it('names none before the first chapter starts', () => {
    expect(chapterAt([{ ...OPENING, startSeconds: 10 }, MIDDLE], 5)).toBeNull();
  });
});
