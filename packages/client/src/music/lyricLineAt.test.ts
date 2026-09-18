import { describe, expect, it } from 'vitest';
import { lyricLineAt } from './lyricLineAt';

const LINES = [
  { atMs: 1000, text: 'One' },
  { atMs: 5000, text: 'Two' },
  { atMs: 9000, text: 'Three' },
];

describe('lyricLineAt', () => {
  it('has no line before the first is sung', () => {
    expect(lyricLineAt(LINES, 500)).toBe(-1);
  });

  it('holds a line until the next one is due', () => {
    expect(lyricLineAt(LINES, 1000)).toBe(0);
    expect(lyricLineAt(LINES, 4999)).toBe(0);
    expect(lyricLineAt(LINES, 5000)).toBe(1);
  });

  it('stays on the last line to the end of the song', () => {
    expect(lyricLineAt(LINES, 200_000)).toBe(2);
  });

  it('follows nothing where the lyrics are not synced', () => {
    expect(lyricLineAt([{ atMs: null, text: 'Plain' }], 3000)).toBe(-1);
  });
});
