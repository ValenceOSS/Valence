import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { chooseLanguageHere } from './chooseLanguageHere';
import { LANGUAGE_CHOICE_KEY } from './LANGUAGE_CHOICE_KEY';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('chooseLanguageHere', () => {
  it('keeps a chosen language on the device, and forgets it when told to follow the device', () => {
    chooseLanguageHere('it');

    expect(platformInUse().store.read(LANGUAGE_CHOICE_KEY)).toBe('it');

    chooseLanguageHere(null);

    expect(platformInUse().store.read(LANGUAGE_CHOICE_KEY)).toBeNull();
  });
});
