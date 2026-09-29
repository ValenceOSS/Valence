import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseSounds, chosenSounds, whenSoundsChange } from './sounds';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('sounds', () => {
  it('is off until somebody turns it on', () => {
    expect(chosenSounds()).toBe(false);
  });

  it('remembers it being turned on, and forgets it again when turned off', () => {
    chooseSounds(true);

    expect(chosenSounds()).toBe(true);

    chooseSounds(false);

    expect(chosenSounds()).toBe(false);
  });

  it('tells whoever is listening, until they stop', () => {
    const heard = vi.fn();
    const stop = whenSoundsChange(heard);

    chooseSounds(true);
    stop();
    chooseSounds(false);

    expect(heard.mock.calls).toEqual([[true]]);
  });
});
