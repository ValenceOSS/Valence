import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseLanguageHere } from './chooseLanguageHere';
import { languageToSpeak } from './languageToSpeak';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('languageToSpeak', () => {
  it('follows the device until somebody chooses a language on it', () => {
    expect(languageToSpeak(['es-MX'])).toBe('es');

    chooseLanguageHere('ko');

    expect(languageToSpeak(['es-MX'])).toBe('ko');
  });
});
