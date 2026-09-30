import { describe, expect, it } from 'vitest';
import { problemsWithEnglish } from './problemsWithEnglish';

const entry = (handler: string, text: string) => ({ handler, text, context: 'Somewhere.' });

describe('problemsWithEnglish', () => {
  it('finds nothing wrong with sorted, distinct strings whose counts have both forms', () => {
    expect(
      problemsWithEnglish([
        entry('common.cancel', 'Cancel'),
        entry('common.episodes.one', '{count} episode'),
        entry('common.episodes.other', '{count} episodes'),
      ]),
    ).toEqual([]);
  });

  it('refuses a handler written twice', () => {
    expect(
      problemsWithEnglish([entry('common.cancel', 'Cancel'), entry('common.cancel', 'Stop')]),
    ).toEqual(['common.cancel is written twice']);
  });

  it('refuses the same words under two handlers, so one string is translated once', () => {
    expect(
      problemsWithEnglish([entry('common.cancel', 'Cancel'), entry('dialog.cancel', 'Cancel')]),
    ).toEqual(['dialog.cancel says the same as common.cancel: "Cancel"']);
  });

  it('lets the two forms of one counted string read the same', () => {
    expect(
      problemsWithEnglish([
        entry('common.more.one', '{count} more'),
        entry('common.more.other', '{count} more'),
      ]),
    ).toEqual([]);
  });

  it('refuses handlers out of order', () => {
    expect(
      problemsWithEnglish([entry('common.save', 'Save'), entry('common.cancel', 'Cancel')]),
    ).toEqual(['common.cancel comes before common.save in handler order']);
  });

  it('refuses a count with only one of its two English forms', () => {
    expect(
      problemsWithEnglish([
        entry('common.films.other', '{count} films'),
        entry('common.songs.one', '{count} song'),
      ]),
    ).toEqual([
      'common.films.other has no .one beside it',
      'common.songs.one has no .other beside it',
    ]);
  });
});
