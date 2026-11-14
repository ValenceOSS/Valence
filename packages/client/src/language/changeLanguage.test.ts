import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { say } from '@ValenceI18n/say';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { changeLanguage } from './changeLanguage';
import { chosenLanguageHere } from './chosenLanguageHere';
import { NEW_WORDS } from './NEW_WORDS';

beforeEach(() => {
  installPlatform(aStillPlatform());
  vi.stubGlobal('navigator', { languages: ['en-GB'] });
});

afterEach(() => {
  speakLanguage('en');
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('changeLanguage', () => {
  it('fetches a new language from the server, speaks it and has the app drawn again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ 'common.cancel': 'Annuler' })))),
    );
    const told = NEW_WORDS.told;

    expect(await changeLanguage('fr')).toBe('fr');
    expect(chosenLanguageHere()).toBe('fr');
    expect(say('common.cancel')).toBe('Annuler');
    expect(NEW_WORDS.told).toBeGreaterThan(told);
  });

  it('goes back to following the device, which here speaks English', async () => {
    expect(await changeLanguage('device')).toBe('en');
    expect(chosenLanguageHere()).toBeNull();
    expect(say('common.cancel')).toBe('Cancel');
  });

  it('speaks English where the server cannot send the words', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await changeLanguage('de')).toBe('de');
    expect(say('common.cancel')).toBe('Cancel');
  });
});
