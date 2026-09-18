import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { installBrowserPlatform } from './installBrowserPlatform';

beforeEach(() => {
  forgetPlatform();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('installBrowserPlatform', () => {
  it('gives this tab an identity that survives being asked twice', () => {
    installBrowserPlatform();

    expect(platformInUse().thisClientId()).toBe(platformInUse().thisClientId());
  });

  it('is a browser on a machine somebody can type on', () => {
    installBrowserPlatform();

    expect(platformInUse().thisClientKind()).toBe('browser');
  });

  it('is a television when the browser is running on one', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 SamsungBrowser/4.0',
    );

    installBrowserPlatform();

    expect(platformInUse().thisClientKind()).toBe('tv');
  });
});
