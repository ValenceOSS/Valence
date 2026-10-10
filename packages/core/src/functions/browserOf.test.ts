import { describe, expect, it } from 'vitest';
import { browserOf } from './browserOf';

const CHROMIUM_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';

describe('browserOf', () => {
  it('calls a Chromium browser Chrome only where it names Google Chrome among its brands', () => {
    expect(browserOf(CHROMIUM_MAC, ['Not A(Brand', 'Google Chrome', 'Chromium'])).toBe('chrome');
    expect(browserOf(CHROMIUM_MAC, ['Not A(Brand', 'Chromium'])).toBe('chromium');
    expect(browserOf(CHROMIUM_MAC)).toBe('chromium');
  });

  it('names a Chromium browser that names itself among its brands', () => {
    expect(browserOf(CHROMIUM_MAC, ['Brave', 'Chromium'])).toBe('brave');
    expect(browserOf(CHROMIUM_MAC, ['Microsoft Edge', 'Chromium'])).toBe('edge');
    expect(browserOf(CHROMIUM_MAC, ['Opera', 'Chromium'])).toBe('opera');
  });

  it('names a browser by the mark in its user agent, with no brands to go on', () => {
    expect(browserOf(`${CHROMIUM_MAC} Edg/154.0.0.0`)).toBe('edge');
    expect(browserOf(`${CHROMIUM_MAC} OPR/120.0.0.0`)).toBe('opera');
    expect(
      browserOf(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0 Mobile Safari/537.36',
      ),
    ).toBe('samsungInternet');
    expect(
      browserOf(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 15.0; rv:140.0) Gecko/20100101 Firefox/140.0',
      ),
    ).toBe('firefox');
    expect(
      browserOf(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('chrome');
  });

  it('tells Safari apart from the Chromium browsers that also say Safari', () => {
    expect(
      browserOf(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      ),
    ).toBe('safari');
  });

  it('names nothing it does not know', () => {
    expect(browserOf('curl/8.7.1')).toBeNull();
  });
});
