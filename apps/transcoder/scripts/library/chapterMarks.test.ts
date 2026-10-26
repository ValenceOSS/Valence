import { describe, expect, it } from 'vitest';
import { chapterMarks } from './chapterMarks';

describe('chapterMarks', () => {
  it('starts as an FFmpeg metadata file', () => {
    expect(chapterMarks(10, 2).startsWith(';FFMETADATA1\n')).toBe(true);
  });

  it('splits the length evenly, end to end', () => {
    const marks = chapterMarks(9, 3);

    expect(marks.match(/START=\d+/gu)).toStrictEqual(['START=0', 'START=3000', 'START=6000']);
    expect(marks.match(/END=\d+/gu)).toStrictEqual(['END=3000', 'END=6000', 'END=9000']);
  });

  it('names each chapter by its number', () => {
    expect(chapterMarks(4, 2)).toContain('title=Chapter 2');
  });
});
