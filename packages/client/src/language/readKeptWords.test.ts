import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { KEPT_WORDS_KEY } from './KEPT_WORDS_KEY';
import { readKeptWords } from './readKeptWords';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('readKeptWords', () => {
  it('reads nothing where nothing was kept, or what was kept no longer reads', () => {
    expect(readKeptWords()).toBeNull();

    platformInUse().store.write(KEPT_WORDS_KEY, '{not json');

    expect(readKeptWords()).toBeNull();
  });
});
