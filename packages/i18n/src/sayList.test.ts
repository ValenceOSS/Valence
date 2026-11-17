import { afterEach, describe, expect, it } from 'vitest';
import { sayList } from './sayList';
import { speakLanguage } from './speakLanguage';

afterEach(() => {
  speakLanguage('en');
});

describe('sayList', () => {
  it('runs names together as English does', () => {
    expect(sayList(['Ana', 'Ben', 'Cleo'])).toBe('Ana, Ben, and Cleo');
  });

  it('runs them together in the language the app speaks, not the browser', () => {
    speakLanguage('fr');

    expect(sayList(['Ana', 'Ben', 'Cleo'])).toBe('Ana, Ben et Cleo');
  });

  it('says one name as it is', () => {
    expect(sayList(['Ana'])).toBe('Ana');
  });
});
