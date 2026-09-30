import { describe, expect, it } from 'vitest';
import { wordsOf } from './wordsOf';

describe('wordsOf', () => {
  it('keeps each handler’s words and leaves the context behind', () => {
    expect(
      wordsOf([
        { handler: 'common.cancel', text: 'Cancel', context: 'Closes a dialog.' },
        { handler: 'common.save', text: 'Save', context: 'Keeps a change.' },
      ]),
    ).toEqual({ 'common.cancel': 'Cancel', 'common.save': 'Save' });
  });
});
