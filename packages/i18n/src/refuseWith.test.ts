import { describe, expect, it } from 'vitest';
import { refuseWith } from './refuseWith';
import { sayVerbatim } from './sayVerbatim';

describe('refuseWith', () => {
  it('answers with something already said', () => {
    expect(refuseWith(sayVerbatim('disk full'))).toEqual({
      error: 'disk full',
      code: null,
      values: {},
    });
  });
});
