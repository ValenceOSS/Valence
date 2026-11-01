import { describe, expect, it } from 'vitest';
import { inAppBrowserOf } from './inAppBrowserOf';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';

describe('inAppBrowserOf', () => {
  it('names the app whose browser a link was followed in, by the mark it adds', () => {
    expect(
      inAppBrowserOf(`${IPHONE} Mobile/22F76 Instagram 380.0.0.0 (iPhone15,2; iOS 18_5)`),
    ).toBe('instagram');
    expect(inAppBrowserOf(`${IPHONE} Mobile/22F76 [FBAN/FBIOS;FBAV/500.0.0]`)).toBe('facebook');
    expect(inAppBrowserOf(`${IPHONE} Mobile/22F76 [FBAN/MessengerForiOS;FBAV/500.0]`)).toBe(
      'messenger',
    );
    expect(
      inAppBrowserOf(`${IPHONE} Version/26.6 Mobile/15E148 Safari/604.1 [WAiOS/2.26.31]`),
    ).toBe('whatsapp');
    expect(
      inAppBrowserOf(
        'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/138.0 Mobile Safari/537.36 musical_ly_2024',
      ),
    ).toBe('tiktok');
  });

  it('calls a view on an iPhone with no Safari mark an app’s browser, since every real browser keeps it', () => {
    expect(inAppBrowserOf(`${IPHONE} Mobile/15E148`)).toBe('unnamed');
  });

  it('calls an Android web view an app’s browser', () => {
    expect(
      inAppBrowserOf(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0 Mobile Safari/537.36',
      ),
    ).toBe('unnamed');
  });

  it('leaves a browser of its own alone', () => {
    expect(inAppBrowserOf(`${IPHONE} Version/18.5 Mobile/15E148 Safari/604.1`)).toBeNull();
    expect(inAppBrowserOf(`${IPHONE} CriOS/138.0 Mobile/15E148 Safari/604.1`)).toBeNull();
    expect(
      inAppBrowserOf(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
      ),
    ).toBeNull();
  });
});
