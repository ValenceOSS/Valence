import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';

const A_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

const AN_ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

/**
 * Asks a freshly loaded copy of the module, since it keeps what a browser answered about its model
 * for as long as the page is open.
 */
const hints = async (): Promise<DeviceHints> => {
  const { hintsAboutThisBrowser } = await import('./hintsAboutThisBrowser');

  return hintsAboutThisBrowser();
};

/**
 * Pretends the page is a browser that says these things about itself.
 */
const aBrowser = (navigator: object): void => {
  vi.stubGlobal('navigator', navigator);
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('CSS', { supports: () => false });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hintsAboutThisBrowser', () => {
  it('says nothing beyond the browser for an ordinary tab', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 0 });

    await expect(hints()).resolves.toEqual({ browser: 'safari' });
  });

  it('says nothing at all where the browser cannot be told', async () => {
    aBrowser({ userAgent: '', maxTouchPoints: 0 });

    await expect(hints()).resolves.toEqual({});
  });

  it('says Valence was opened from an iPhone’s home screen', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 0, standalone: true });

    await expect(hints()).resolves.toMatchObject({ app: 'webApp' });
  });

  it('says Valence was installed where the page shows standalone', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 0 });
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(display-mode: standalone)',
    }));

    await expect(hints()).resolves.toMatchObject({ app: 'webApp' });
  });

  it('does not take a page that is only not standalone for a home-screen app', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 0, standalone: false });

    await expect(hints()).resolves.not.toHaveProperty('app');
  });

  it('tells an iPad asking for the desktop site from the Mac it claims to be', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 5 });
    vi.stubGlobal('CSS', {
      supports: (property: string, value: string) =>
        property === '-webkit-touch-callout' && value === 'none',
    });

    await expect(hints()).resolves.toMatchObject({ system: 'ipados', form: 'tablet' });
  });

  it('keeps a Mac with a touchscreen a Mac', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 5 });

    const said = await hints();

    expect(said).not.toHaveProperty('system');
    expect(said).not.toHaveProperty('form');
  });

  it('keeps a Mac that understands the touch style but takes one finger a Mac', async () => {
    aBrowser({ userAgent: A_MAC, maxTouchPoints: 1 });
    vi.stubGlobal('CSS', { supports: () => true });

    await expect(hints()).resolves.not.toHaveProperty('system');
  });

  it('does not take a touchscreen that is not a Mac for an iPad', async () => {
    aBrowser({ userAgent: AN_ANDROID_PHONE, maxTouchPoints: 5 });
    vi.stubGlobal('CSS', { supports: () => true });

    await expect(hints()).resolves.not.toHaveProperty('system');
  });

  it('says Brave is Brave where it calls itself Chrome', async () => {
    aBrowser({
      userAgent: AN_ANDROID_PHONE,
      maxTouchPoints: 5,
      brave: {},
      userAgentData: { brands: [{ brand: 'Google Chrome' }] },
    });

    await expect(hints()).resolves.toMatchObject({ browser: 'brave' });
  });

  it('reads the browser from the brands its client hints name', async () => {
    aBrowser({
      userAgent: AN_ANDROID_PHONE,
      maxTouchPoints: 5,
      userAgentData: { brands: [{ brand: 'Not A(Brand' }, { brand: 'Microsoft Edge' }] },
    });

    await expect(hints()).resolves.toMatchObject({ browser: 'edge' });
  });

  it('names the model once the browser has answered being asked for it', async () => {
    const getHighEntropyValues = vi.fn(() => Promise.resolve({ model: ' Pixel 9 ' }));

    aBrowser({
      userAgent: AN_ANDROID_PHONE,
      maxTouchPoints: 5,
      userAgentData: { brands: [{ brand: 'Google Chrome' }], getHighEntropyValues },
    });

    await expect(hints()).resolves.not.toHaveProperty('model');
    await vi.waitFor(async () => {
      await expect(hints()).resolves.toMatchObject({ model: 'Pixel 9' });
    });
    expect(getHighEntropyValues).toHaveBeenCalledOnce();
    expect(getHighEntropyValues).toHaveBeenCalledWith(['model']);
  });

  it('names no model where the browser answers with none', async () => {
    const getHighEntropyValues = vi.fn(() => Promise.resolve({ model: '' }));

    aBrowser({
      userAgent: AN_ANDROID_PHONE,
      maxTouchPoints: 5,
      userAgentData: { brands: [], getHighEntropyValues },
    });

    await hints();
    await vi.waitFor(() => {
      expect(getHighEntropyValues).toHaveBeenCalled();
    });

    await expect(hints()).resolves.not.toHaveProperty('model');
  });

  it('carries on where the browser refuses to be asked', async () => {
    aBrowser({
      userAgent: AN_ANDROID_PHONE,
      maxTouchPoints: 5,
      userAgentData: { brands: [], getHighEntropyValues: () => Promise.reject(new Error('no')) },
    });

    await expect(hints()).resolves.not.toHaveProperty('model');
    await expect(hints()).resolves.not.toHaveProperty('model');
  });
});
