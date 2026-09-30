import { afterEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseOffline } from '@ValenceClient/offline/chosenOffline';
import { isOfflineNow } from './isOfflineNow';

const unreachable = { isReachable: () => false, whenChanged: () => () => {} };

afterEach(() => {
  forgetPlatform();
});

describe('isOfflineNow', () => {
  it('is online while the server answers and nobody asked otherwise', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true }));

    expect(isOfflineNow()).toBe(false);
  });

  it('is offline the moment somebody asks to be', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true }));
    chooseOffline(true);

    expect(isOfflineNow()).toBe(true);
  });

  it('is offline while the server is out of reach', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true, reachability: unreachable }));

    expect(isOfflineNow()).toBe(true);
  });

  it('is never offline on a client that keeps nothing', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => false, reachability: unreachable }));
    chooseOffline(true);

    expect(isOfflineNow()).toBe(false);
  });
});
