import { describe, expect, it } from 'vitest';
import { sortStrings } from './sortStrings';

describe('sortStrings', () => {
  it('puts the strings in handler order without touching what it was given', () => {
    const english = [
      { handler: 'common.save', text: 'Save', context: 'Keeps a change.' },
      { handler: 'common.cancel', text: 'Cancel', context: 'Closes a dialog.' },
    ];

    expect(sortStrings(english).map((entry) => entry.handler)).toEqual([
      'common.cancel',
      'common.save',
    ]);
    expect(english[0]?.handler).toBe('common.save');
  });
});
