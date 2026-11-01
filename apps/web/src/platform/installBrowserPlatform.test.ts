import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { readDeviceHints } from '@ValenceContracts/functions/readDeviceHints';
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

  it('describes the device it runs on as well as naming the browser', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0) Firefox/121.0' });

    installBrowserPlatform();

    expect(platformInUse().describeThisDevice()).toEqual({ browser: 'firefox' });
  });

  it('tells the server which device each of the page’s own requests comes from', async () => {
    const asked = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null)));

    vi.stubGlobal('fetch', asked);
    installBrowserPlatform();
    await fetch('/api/session');

    const [, init] = asked.mock.calls[0] ?? [];

    expect(readDeviceHints(new Headers(init?.headers).get(DEVICE_HEADER)).id).toBe(
      window.localStorage.getItem('valence.deviceId'),
    );
  });
});
