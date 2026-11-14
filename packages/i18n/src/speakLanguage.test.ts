import { afterEach, describe, expect, it } from 'vitest';
import { say } from './say';
import { sayCount } from './sayCount';
import { speakLanguage } from './speakLanguage';

afterEach(() => {
  speakLanguage('en');
});

describe('speakLanguage', () => {
  it('says what the language has, and English for what it does not', () => {
    speakLanguage('de', { 'common.cancel': 'Abbrechen' });

    expect(say('common.cancel')).toBe('Abbrechen');
    expect(say('common.save')).toBe('Save');
  });

  it('picks the plural form the language uses for a number, and writes the number its way', () => {
    speakLanguage('pl', {
      'common.count.items.one': '{count} pozycja',
      'common.count.items.few': '{count} pozycje',
      'common.count.items.many': '{count} pozycji',
      'common.count.items.other': '{count} pozycji',
    });

    expect(sayCount('common.count.items', 1)).toBe('1 pozycja');
    expect(sayCount('common.count.items', 3)).toBe('3 pozycje');
    expect(sayCount('common.count.items', 5)).toBe('5 pozycji');
    expect(sayCount('common.count.items', 1200)).toBe('1200 pozycji');
  });
});
