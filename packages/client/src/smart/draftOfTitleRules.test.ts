import { describe, expect, it } from 'vitest';
import { draftOfTitleRules } from './draftOfTitleRules';

describe('draftOfTitleRules', () => {
  it('starts a new collection as films, newest first, with no limit', () => {
    expect(draftOfTitleRules(null)).toEqual({
      holds: 'films',
      rules: [],
      order: 'added',
      limit: '',
    });
  });

  it('holds a collection’s rules to edit', () => {
    expect(
      draftOfTitleRules({
        holds: 'series',
        rules: [{ kind: 'watched', state: 'unwatched' }],
        order: 'title',
        limit: 20,
      }),
    ).toMatchObject({
      holds: 'series',
      order: 'title',
      limit: '20',
      rules: [{ choice: 'unwatched' }],
    });
  });
});
