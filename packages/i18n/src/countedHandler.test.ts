import { afterEach, describe, expect, it } from 'vitest';
import { countedHandler } from './countedHandler';
import { speakLanguage } from './speakLanguage';

afterEach(() => {
  speakLanguage('en');
});

describe('countedHandler', () => {
  it('picks one or other in English', () => {
    expect(countedHandler('common.count.items', 1)).toBe('common.count.items.one');
    expect(countedHandler('common.count.items', 2)).toBe('common.count.items.other');
  });

  it('picks the language’s own form where its file has one, and other where it does not', () => {
    speakLanguage('pl', { 'common.count.items.few': '{count} pozycje' });

    expect(countedHandler('common.count.items', 3)).toBe('common.count.items.few');
    expect(countedHandler('common.count.items', 5)).toBe('common.count.items.other');
  });
});
