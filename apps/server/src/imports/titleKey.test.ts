import { describe, expect, it } from 'vitest';
import { titleKey } from './titleKey';

describe('titleKey', () => {
  it('compares titles without case, accents, punctuation or a leading article', () => {
    expect(titleKey('The Wire')).toBe(titleKey('wire'));
    expect(titleKey('Amélie!')).toBe('amelie');
    expect(titleKey('Fast & Furious')).toBe('fast and furious');
  });
});
