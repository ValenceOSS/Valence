import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CHOSEN_THIS_LAUNCH } from './CHOSEN_THIS_LAUNCH';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { launchStore } from './launchStore';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
});

describe('noteChosenThisLaunch', () => {
  it('notes which account chose, for as long as the app is open', () => {
    noteChosenThisLaunch('acc-1');

    expect(launchStore().read(CHOSEN_THIS_LAUNCH)).toBe('acc-1');
    expect(hasChosenThisLaunch('acc-1')).toBe(true);
  });

  it('notes only the account that chose last, since one device signs in as one at a time', () => {
    noteChosenThisLaunch('acc-1');
    noteChosenThisLaunch('acc-2');

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
    expect(hasChosenThisLaunch('acc-2')).toBe(true);
  });

  it('notes it in the launch’s store rather than the device’s, which outlasts the app', () => {
    const device = aFakePlatform().store;

    installPlatform(aFakePlatform({ store: device, thisLaunch: aFakePlatform().store }));
    noteChosenThisLaunch('acc-1');

    expect(device.read(CHOSEN_THIS_LAUNCH)).toBeNull();
  });
});
