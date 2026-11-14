import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { say } from '@ValenceI18n/say';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { KEPT_WORDS_KEY } from './KEPT_WORDS_KEY';
import { speakTheKeptWords } from './speakTheKeptWords';

beforeEach(() => {
  installPlatform(aStillPlatform());
  platformInUse().store.write(
    KEPT_WORDS_KEY,
    JSON.stringify({ language: 'de', fetchedAt: 0, words: { 'common.cancel': 'Abbrechen' } }),
  );
});

afterEach(() => {
  speakLanguage('en');
  forgetPlatform();
});

describe('speakTheKeptWords', () => {
  it('speaks the kept words at once where they are the language the device wants', () => {
    expect(speakTheKeptWords(['de-DE'])).toBe('de');
    expect(say('common.cancel')).toBe('Abbrechen');
  });

  it('speaks English until the words of another language arrive', () => {
    expect(speakTheKeptWords(['fr-FR'])).toBe('fr');
    expect(say('common.cancel')).toBe('Cancel');
  });
});
