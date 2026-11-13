import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseLanguageHere } from './chooseLanguageHere';
import { chosenLanguageHere } from './chosenLanguageHere';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('chosenLanguageHere', () => {
  it('reads back the language chosen on this device, and nothing once the choice is forgotten', () => {
    expect(chosenLanguageHere()).toBeNull();

    chooseLanguageHere('ja');

    expect(chosenLanguageHere()).toBe('ja');

    chooseLanguageHere(null);

    expect(chosenLanguageHere()).toBeNull();
  });
});
