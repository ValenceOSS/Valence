import { describe, expect, it } from 'vitest';
import { refuse } from './refuse';
import { saidFrom } from './saidFrom';
import { saying } from './saying';

describe('saidFrom', () => {
  it('reads a refusal back as what it said', () => {
    expect(saidFrom(refuse('error.common.nobodyIsSignedIn'))).toEqual(
      saying('error.common.nobodyIsSignedIn'),
    );
  });
});
