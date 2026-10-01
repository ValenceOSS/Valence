import { describe, expect, it } from 'vitest';
import { arrIdOf } from './arrIdOf';
import { pickArrProfile } from './pickArrProfile';

const HD = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'HD' };

describe('pickArrProfile', () => {
  it('finds the profile offered under the number sent back', () => {
    expect(pickArrProfile([HD], arrIdOf(HD.id))).toBe(HD.id);
  });

  it('leaves the choice to the library for the first profile offered', () => {
    expect(pickArrProfile([HD], 1)).toBeUndefined();
  });

  it('leaves the choice to the library for a number it never offered', () => {
    expect(pickArrProfile([HD], 42)).toBeUndefined();
    expect(pickArrProfile([HD], undefined)).toBeUndefined();
  });
});
