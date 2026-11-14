import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { LANGUAGES_IN_USE_KEY } from './LANGUAGES_IN_USE_KEY';
import { readLanguagesInUse } from './readLanguagesInUse';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('readLanguagesInUse', () => {
  it('reads neither where nothing was kept, or what was kept no longer reads', () => {
    expect(readLanguagesInUse()).toEqual({ server: null, profile: null });

    platformInUse().store.write(LANGUAGES_IN_USE_KEY, '{not json');

    expect(readLanguagesInUse()).toEqual({ server: null, profile: null });

    platformInUse().store.write(LANGUAGES_IN_USE_KEY, '{"server":"xx","profile":null}');

    expect(readLanguagesInUse()).toEqual({ server: null, profile: null });
  });

  it('reads what was kept', () => {
    platformInUse().store.write(LANGUAGES_IN_USE_KEY, '{"server":"de","profile":"fr"}');

    expect(readLanguagesInUse()).toEqual({ server: 'de', profile: 'fr' });
  });
});
