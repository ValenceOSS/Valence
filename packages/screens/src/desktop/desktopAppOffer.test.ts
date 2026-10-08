import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { desktopAppOffer } from './desktopAppOffer';

const A_WINDOWS_PC =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const AN_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientKind: () => 'browser' }));
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(A_WINDOWS_PC);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.valenceDesktop;
});

describe('desktopAppOffer', () => {
  it('names the computer a browser is open on', () => {
    expect(desktopAppOffer()).toBe('Windows');
  });

  it('offers nothing on a phone', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(AN_IPHONE);

    expect(desktopAppOffer()).toBeNull();
  });

  it('offers nothing to a client that is not a browser', () => {
    installPlatform(aFakePlatform({ thisClientKind: () => 'desktop' }));

    expect(desktopAppOffer()).toBeNull();
  });

  it('offers nothing inside the desktop app itself', () => {
    document.documentElement.dataset.valenceDesktop = 'true';

    expect(desktopAppOffer()).toBeNull();
  });
});
