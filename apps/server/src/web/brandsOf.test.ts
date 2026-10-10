import { describe, expect, it } from 'vitest';
import { brandsOf } from './brandsOf';

describe('brandsOf', () => {
  it('reads the brands a Chromium browser names in its client hint', () => {
    expect(brandsOf('"Not A(Brand";v="99", "Google Chrome";v="154", "Chromium";v="154"')).toEqual([
      'Not A(Brand',
      'Google Chrome',
      'Chromium',
    ]);
  });

  it('reads none where no hint was sent', () => {
    expect(brandsOf(null)).toEqual([]);
    expect(brandsOf(undefined)).toEqual([]);
    expect(brandsOf('nonsense')).toEqual([]);
  });
});
