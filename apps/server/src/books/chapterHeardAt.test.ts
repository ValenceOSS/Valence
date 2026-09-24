import { describe, expect, it } from 'vitest';
import { chapterHeardAt } from '@ValenceServer/books/chapterHeardAt';

const MARKS = [
  { title: 'Boot Sequence', startSeconds: 0, endSeconds: 50 },
  { title: 'Servo Groove', startSeconds: 50, endSeconds: 200 },
];

describe('chapterHeardAt', () => {
  it('names the chapter the track marks where somebody has got to', () => {
    expect(chapterHeardAt('Songs for Sentient Toasters', MARKS, 120)).toBe('Servo Groove');
    expect(chapterHeardAt('Songs for Sentient Toasters', MARKS, 0)).toBe('Boot Sequence');
  });

  it('names the track where it marks no chapters', () => {
    expect(chapterHeardAt('Part 1', [], 120)).toBe('Part 1');
  });
});
