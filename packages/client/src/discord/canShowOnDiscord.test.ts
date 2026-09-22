import { afterEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { canShowOnDiscord } from './canShowOnDiscord';

afterEach(() => {
  forgetPlatform();
});

describe('canShowOnDiscord', () => {
  it('says yes on the desktop client', () => {
    installPlatform(aFakePlatform({ thisClientKind: () => 'desktop' }));

    expect(canShowOnDiscord()).toBe(true);
  });

  it('says no in a browser', () => {
    installPlatform(aFakePlatform({ thisClientKind: () => 'browser' }));

    expect(canShowOnDiscord()).toBe(false);
  });

  it('says no on a TV', () => {
    installPlatform(aFakePlatform({ thisClientKind: () => 'tv' }));

    expect(canShowOnDiscord()).toBe(false);
  });
});
