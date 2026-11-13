import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { say } from '@ValenceI18n/say';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseLanguageHere } from './chooseLanguageHere';
import { startSpeaking } from './startSpeaking';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  speakLanguage('en');
  forgetPlatform();
});

describe('startSpeaking', () => {
  it('speaks the first of the device’s languages Valence has', async () => {
    const loadWords = vi.fn(() => Promise.resolve({ 'common.cancel': 'Abbrechen' }));

    expect(await startSpeaking(['de-AT', 'en'], loadWords)).toBe('de');
    expect(loadWords).toHaveBeenCalledWith('de');
    expect(say('common.cancel')).toBe('Abbrechen');
  });

  it('prefers a language chosen on the device over the device’s own', async () => {
    chooseLanguageHere('fr');

    expect(await startSpeaking(['de'], () => Promise.resolve({}))).toBe('fr');
  });

  it('fetches nothing for English', async () => {
    const loadWords = vi.fn(() => Promise.resolve({}));

    expect(await startSpeaking(['en-GB'], loadWords)).toBe('en');
    expect(loadWords).not.toHaveBeenCalled();
  });

  it('falls back to English where the words cannot be fetched', async () => {
    expect(await startSpeaking(['de'], () => Promise.reject(new Error('offline')))).toBe('en');
    expect(say('common.cancel')).toBe('Cancel');
  });
});
