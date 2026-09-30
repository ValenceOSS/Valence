import { describe, expect, it } from 'vitest';
import { bodyOf } from './bodyOf';
import { refuse } from './refuse';

describe('bodyOf', () => {
  it('keeps only the body of a refusal carried with a status', () => {
    const withStatus = { ...refuse('error.common.nobodyIsSignedIn'), status: 401 };

    expect(bodyOf(withStatus)).toEqual(refuse('error.common.nobodyIsSignedIn'));
  });
});
