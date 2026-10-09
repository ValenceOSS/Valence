import { describe, expect, it } from 'vitest';
import { narrationOfRelease } from './narrationOfRelease';

const NARRATIONS = [
  { asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 600, series: null },
  { asin: 'B', narrators: ['Bob Voice', 'Cat Speaker'], runtimeMinutes: 610, series: null },
];

describe('narrationOfRelease', () => {
  it('reads which narration a release names by a narrator’s surname', () => {
    expect(narrationOfRelease('Author - A Book (Read by Ann Reader) [M4B]', NARRATIONS)).toBe('A');
    expect(narrationOfRelease('Author.A.Book.Voice.MP3', NARRATIONS)).toBe('B');
  });

  it('names none where the release names nobody, or more than one narration', () => {
    expect(narrationOfRelease('Author - A Book [M4B]', NARRATIONS)).toBeNull();
    expect(narrationOfRelease('A Book Reader Voice', NARRATIONS)).toBeNull();
    expect(narrationOfRelease('Readers Digest', NARRATIONS)).toBeNull();
  });
});
