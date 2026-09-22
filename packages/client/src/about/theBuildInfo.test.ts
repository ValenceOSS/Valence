import { afterEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theBuildInfo } from './theBuildInfo';

afterEach(() => {
  forgetPlatform();
});

describe('theBuildInfo', () => {
  it('gives nothing on a client with no build to report', () => {
    installPlatform(aFakePlatform({ buildInfo: () => null }));

    expect(theBuildInfo()).toBeNull();
  });

  it('gives what the platform reports it is running', () => {
    const info = {
      version: '1.2.0',
      commit: '2ae1bc1',
      arch: 'arm64',
      electron: '33.0.0',
      chrome: '130.0.0',
    };

    installPlatform(aFakePlatform({ buildInfo: () => info }));

    expect(theBuildInfo()).toEqual(info);
  });
});
