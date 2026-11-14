import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { chooseLanguageHere } from './chooseLanguageHere';
import { LANGUAGES_IN_USE_KEY } from './LANGUAGES_IN_USE_KEY';
import { languageToSpeak } from './languageToSpeak';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

/**
 * Keeps on the device the languages the server last said were chosen.
 *
 * @param server - The server's language.
 * @param profile - The profile's language.
 */
const heard = (server: string | null, profile: string | null): void => {
  platformInUse().store.write(LANGUAGES_IN_USE_KEY, JSON.stringify({ server, profile }));
};

describe('languageToSpeak', () => {
  it('follows the device until somebody chooses a language on it', () => {
    expect(languageToSpeak(['es-MX'])).toBe('es');

    chooseLanguageHere('ko');

    expect(languageToSpeak(['es-MX'])).toBe('ko');
  });

  it('puts the server’s language before the device’s, and the profile’s before the server’s', () => {
    heard('de', null);

    expect(languageToSpeak(['es-MX'])).toBe('de');

    heard('de', 'ja');

    expect(languageToSpeak(['es-MX'])).toBe('ja');
  });

  it('puts a language chosen on this device before the profile’s', () => {
    heard('de', 'ja');
    chooseLanguageHere('ko');

    expect(languageToSpeak(['es-MX'])).toBe('ko');
  });
});
