import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  readAudioLanguage,
  readSubtitleLanguage,
  saveAudioLanguage,
  saveSubtitleLanguage,
} from './languagePreference';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('languagePreference', () => {
  it('remembers nothing until something is chosen', () => {
    expect(readSubtitleLanguage()).toBeNull();
    expect(readAudioLanguage()).toBeNull();
  });

  it('remembers the subtitle and soundtrack languages apart', () => {
    saveSubtitleLanguage('fr');
    saveAudioLanguage('ja');

    expect(readSubtitleLanguage()).toBe('fr');
    expect(readAudioLanguage()).toBe('ja');
  });
});
