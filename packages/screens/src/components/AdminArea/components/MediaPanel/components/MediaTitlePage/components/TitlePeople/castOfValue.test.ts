import { describe, expect, it } from 'vitest';
import { castOfValue } from './castOfValue';

describe('castOfValue', () => {
  it('reads the people of a cast, and nothing from any other value', () => {
    const member = { personId: null, name: 'Someone', role: '', imageUrl: null };

    expect(castOfValue([member])).toEqual([member]);
    expect(castOfValue(['a word'])).toEqual([]);
    expect(castOfValue(null)).toEqual([]);
    expect(castOfValue(undefined)).toEqual([]);
  });
});
