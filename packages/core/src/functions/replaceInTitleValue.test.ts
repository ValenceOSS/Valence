import { describe, expect, it } from 'vitest';
import { replaceInTitleValue } from './replaceInTitleValue';

const replacing = (
  field: 'title' | 'overview' | 'genres',
  find: string,
  put: string,
  matchCase = false,
) => ({
  field,
  find,
  with: put,
  matchCase,
});

describe('replaceInTitleValue', () => {
  it('replaces every place the words appear in a line, whatever their case unless asked', () => {
    expect(replaceInTitleValue('Colour and COLOUR', replacing('overview', 'colour', 'color'))).toBe(
      'color and color',
    );
    expect(
      replaceInTitleValue('Colour and COLOUR', replacing('overview', 'Colour', 'Color', true)),
    ).toBe('Color and COLOUR');
  });

  it('takes what it finds literally, not as a pattern', () => {
    expect(replaceInTitleValue('A (2001) cut', replacing('overview', '(2001)', ''))).toBe('A  cut');
  });

  it('renames a word of a list, merging it with one already there, and drops an emptied one', () => {
    expect(
      replaceInTitleValue(['Sci-Fi', 'Drama'], replacing('genres', 'sci-fi', 'Science Fiction')),
    ).toEqual(['Science Fiction', 'Drama']);
    expect(replaceInTitleValue(['Scifi', 'SciFi'], replacing('genres', 'scifi', 'SciFi'))).toEqual([
      'SciFi',
    ]);
    expect(replaceInTitleValue(['Old', 'Kept'], replacing('genres', 'old', ''))).toEqual(['Kept']);
  });

  it('leaves the value as it was where nothing is found, and a title it would empty', () => {
    const words = ['Drama'];

    expect(replaceInTitleValue(words, replacing('genres', 'Comedy', 'Funny'))).toBe(words);
    expect(replaceInTitleValue('Gone', replacing('title', 'Gone', ''))).toBe('Gone');
    expect(replaceInTitleValue('Gone', replacing('overview', 'Gone', ''))).toBeNull();
    expect(replaceInTitleValue(null, replacing('overview', 'x', 'y'))).toBeNull();
  });
});
