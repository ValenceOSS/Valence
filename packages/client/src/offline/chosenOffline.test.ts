import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { STORAGE_KEY, chooseOffline, chosenOffline, followChosenOffline } from './chosenOffline';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('chosenOffline', () => {
  it('starts as nobody having asked for anything', () => {
    expect(chosenOffline()).toBe(false);
  });

  it('remembers somebody asking to be offline', () => {
    chooseOffline(true);

    expect(chosenOffline()).toBe(true);
  });

  it('forgets it again rather than remembering a no', () => {
    chooseOffline(true);
    chooseOffline(false);

    expect([chosenOffline(), platformInUse().store.read(STORAGE_KEY)]).toEqual([false, null]);
  });

  it('keeps it on the device, so another machine is unaffected', () => {
    chooseOffline(true);

    installPlatform(aFakePlatform());

    expect(chosenOffline()).toBe(false);
  });

  it('tells whoever is following when somebody goes offline or comes back', () => {
    const heard: boolean[] = [];

    followChosenOffline((isChosen) => heard.push(isChosen));
    chooseOffline(true);
    chooseOffline(false);

    expect(heard).toEqual([true, false]);
  });

  it('stops telling a listener that has stopped following', () => {
    const heard: boolean[] = [];

    const stop = followChosenOffline((isChosen) => heard.push(isChosen));

    stop();
    chooseOffline(true);

    expect(heard).toEqual([]);
  });
});
