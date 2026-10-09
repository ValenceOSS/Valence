import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { areDeviceNoticesOn, chooseDeviceNotices } from './deviceNotices';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('areDeviceNoticesOn', () => {
  it('is off until somebody turns it on', () => {
    expect(areDeviceNoticesOn()).toBe(false);
  });

  it('remembers being turned on', () => {
    chooseDeviceNotices(true);

    expect(areDeviceNoticesOn()).toBe(true);
  });

  it('forgets the choice when turned off again, rather than remembering an off', () => {
    chooseDeviceNotices(true);
    chooseDeviceNotices(false);

    expect(areDeviceNoticesOn()).toBe(false);
  });
});
