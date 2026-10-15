import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetChosenThisLaunch } from './forgetChosenThisLaunch';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisLaunch: aFakePlatform().store }));
});

describe('forgetChosenThisLaunch', () => {
  it('forgets that anybody chose, so the app asks again', () => {
    noteChosenThisLaunch('acc-1');
    forgetChosenThisLaunch();

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
  });

  it('does nothing harmful where nobody had chosen', () => {
    forgetChosenThisLaunch();

    expect(hasChosenThisLaunch('acc-1')).toBe(false);
  });
});
