import { describe, expect, it } from 'vitest';
import { refuse } from './refuse';

describe('refuse', () => {
  it('answers with the English under error, and the code and values beside it', () => {
    expect(refuse('error.common.nobodyIsSignedIn')).toEqual({
      error: 'Nobody is signed in.',
      code: 'error.common.nobodyIsSignedIn',
      values: {},
    });
  });
});
