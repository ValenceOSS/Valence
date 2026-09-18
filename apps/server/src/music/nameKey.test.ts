import { describe, expect, it } from 'vitest';
import { nameKey } from './nameKey';

describe('nameKey', () => {
  it('matches two taggings of the same name', () => {
    expect(nameKey('Sleep Token')).toBe(nameKey('sleep  token '));
  });

  it('ignores accents a tagger may or may not have typed', () => {
    expect(nameKey('Beyoncé')).toBe(nameKey('Beyonce'));
  });

  it('reads either apostrophe as the same one', () => {
    expect(nameKey('Guns N’ Roses')).toBe(nameKey("Guns N' Roses"));
  });
});
