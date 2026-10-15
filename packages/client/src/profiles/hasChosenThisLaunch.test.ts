import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CHOSEN_THIS_LAUNCH } from './CHOSEN_THIS_LAUNCH';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { launchStore } from './launchStore';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
});

describe('hasChosenThisLaunch', () => {
  it('says nobody has chosen when the app has just started', () => {
    expect(hasChosenThisLaunch('acc-1')).toBe(false);
  });

  it('says somebody on the account chose since the app started', () => {
    launchStore().write(CHOSEN_THIS_LAUNCH, 'acc-1');

    expect(hasChosenThisLaunch('acc-1')).toBe(true);
  });

  it('says nobody chose on an account other than the one that did', () => {
    launchStore().write(CHOSEN_THIS_LAUNCH, 'acc-1');

    expect(hasChosenThisLaunch('acc-2')).toBe(false);
  });
});
