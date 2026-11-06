import { describe, expect, it } from 'vitest';
import { changeOfTouches } from './changeOfTouches';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { BulkTouch } from './BulkTouch.types';

describe('changeOfTouches', () => {
  it('sends each field as it was touched, and nothing of the fields left alone', () => {
    const touches = new Map<TitleField, BulkTouch>([
      ['tagline', { kind: 'set', value: 'A line' }],
      ['genres', { kind: 'words', how: 'add', words: ['Drama'] }],
      ['tags', { kind: 'words', how: 'remove', words: ['old'] }],
      ['studios', { kind: 'words', how: 'replace', words: ['A24'] }],
      ['overview', { kind: 'clear' }],
      ['note', { kind: 'reset' }],
      ['sortTitle', { kind: 'fromTitle' }],
      ['certifications', { kind: 'rating', rating: '15' }],
    ]);

    expect(changeOfTouches(touches, 'GB')).toEqual({
      set: { tagline: 'A line', studios: ['A24'] },
      add: { genres: ['Drama'] },
      remove: { tags: ['old'] },
      clear: ['overview'],
      reset: ['note'],
      sortTitleFromTitle: true,
      contentRating: { region: 'GB', rating: '15' },
    });
  });

  it('sends no change where nothing was touched', () => {
    expect(changeOfTouches(new Map(), 'GB')).toEqual({});
  });
});
