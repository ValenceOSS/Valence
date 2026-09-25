import { describe, expect, it } from 'vitest';
import { valuesOf } from './valuesOf';

describe('valuesOf', () => {
  it('keeps each key with only its words', () => {
    expect(
      valuesOf({
        'common.cancel': { value: 'Cancel' },
        'common.delete': { value: 'Delete' },
      }),
    ).toEqual({ 'common.cancel': 'Cancel', 'common.delete': 'Delete' });
  });
});
