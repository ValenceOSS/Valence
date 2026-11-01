import { describe, expect, it } from 'vitest';
import { identifyDevice } from './identifyDevice';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';

const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';

const ELECTRON =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Electron/38.0.0 Safari/537.36';

describe('identifyDevice', () => {
  it('reads a browser and the device it runs on from its user agent', () => {
    expect(
      identifyDevice({ userAgent: `${IPHONE} Version/18.5 Mobile/15E148 Safari/604.1` }),
    ).toEqual({
      app: 'browser',
      system: 'ios',
      form: 'phone',
      browser: 'safari',
      inApp: null,
      maker: null,
      model: null,
      name: null,
    });
  });

  it('believes what a page says its user agent hides: an iPad asking for the desktop site', () => {
    expect(identifyDevice({ userAgent: MAC_SAFARI, hints: { system: 'ipados' } })).toMatchObject({
      system: 'ipados',
      form: 'tablet',
      browser: 'safari',
    });
  });

  it('takes Valence opened from a home screen for the web app, not an app’s browser', () => {
    expect(
      identifyDevice({ userAgent: `${IPHONE} Mobile/15E148`, hints: { app: 'webApp' } }),
    ).toMatchObject({ app: 'webApp', inApp: null });
    expect(identifyDevice({ userAgent: `${IPHONE} Mobile/15E148` })).toMatchObject({
      app: 'browser',
      inApp: 'unnamed',
      browser: null,
    });
  });

  it('names an app’s own browser in place of the Safari it says it is', () => {
    expect(
      identifyDevice({
        userAgent: `${IPHONE} Version/26.6 Mobile/15E148 Safari/604.1 [WAiOS/2.26.31]`,
      }),
    ).toMatchObject({ inApp: 'whatsapp', browser: null });
  });

  it('describes Valence’s own phone app by what it says, with its model and its name', () => {
    expect(
      identifyDevice({
        userAgent: 'Valence (Dan’s Pixel)',
        kind: 'phone',
        hints: { app: 'phone', system: 'android', model: 'Pixel 9', name: 'Dan’s Pixel' },
      }),
    ).toEqual({
      app: 'phone',
      system: 'android',
      form: 'phone',
      browser: null,
      inApp: null,
      maker: null,
      model: 'Pixel 9',
      name: 'Dan’s Pixel',
    });
  });

  it('takes the name an iPhone gives every app for no name at all', () => {
    expect(
      identifyDevice({
        userAgent: 'Valence (iPhone)',
        kind: 'phone',
        hints: { app: 'phone', system: 'ios', model: 'iPhone 17 Pro Max', name: 'iPhone' },
      }),
    ).toMatchObject({ model: 'iPhone 17 Pro Max', name: null });
  });

  it('drops a name that only repeats the model', () => {
    expect(
      identifyDevice({ userAgent: null, hints: { model: 'Pixel 9', name: 'Pixel 9' } }),
    ).toMatchObject({ model: 'Pixel 9', name: null });
  });

  it('reads an older phone app from the name it wrote into its user agent', () => {
    expect(
      identifyDevice({ userAgent: 'Valence (Dan’s Pixel on Android)', kind: 'phone' }),
    ).toMatchObject({ app: 'phone', system: 'android', form: 'phone', name: 'Dan’s Pixel' });
    expect(identifyDevice({ userAgent: 'Valence (Kitchen iPhone)', kind: 'phone' })).toMatchObject({
      app: 'phone',
      system: 'ios',
      name: 'Kitchen iPhone',
    });
  });

  it('takes an app’s networking library for the phone app it belongs to', () => {
    expect(identifyDevice({ userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0' })).toMatchObject({
      app: 'phone',
      system: 'ios',
    });
    expect(identifyDevice({ userAgent: 'okhttp/4.12.0' })).toMatchObject({
      app: 'phone',
      system: 'android',
    });
  });

  it('describes the desktop app by the system in its user agent and the name it was given', () => {
    expect(
      identifyDevice({
        userAgent: ELECTRON,
        kind: 'desktop',
        hints: { name: 'Dan’s MacBook Pro' },
      }),
    ).toMatchObject({
      app: 'desktop',
      system: 'macos',
      form: 'computer',
      name: 'Dan’s MacBook Pro',
    });
    expect(identifyDevice({ userAgent: ELECTRON })).toMatchObject({ app: 'desktop' });
  });

  it('describes a television’s own browser by whose television it is', () => {
    expect(
      identifyDevice({
        userAgent:
          'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/108.0 Safari/537.36',
        kind: 'tv',
      }),
    ).toMatchObject({ app: 'browser', system: 'webos', form: 'tv' });
    expect(
      identifyDevice({
        userAgent:
          'Mozilla/5.0 (Linux; VIDAA/6.0(Hisense;SmartTV;55A6H)) AppleWebKit/537.36 Chrome/88.0 Safari/537.36',
      }),
    ).toMatchObject({ system: null, form: 'tv', maker: 'Hisense' });
  });

  it('describes Valence’s television app by the television it says it is', () => {
    expect(
      identifyDevice({
        userAgent: 'Valence (Living Room)',
        kind: 'tv',
        hints: { app: 'tv', system: 'tvos', name: 'Living Room' },
      }),
    ).toMatchObject({ app: 'tv', system: 'tvos', form: 'tv', name: 'Living Room' });
  });

  it('takes the browser a page names over the one its user agent suggests', () => {
    expect(
      identifyDevice({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36',
        hints: { browser: 'brave' },
      }),
    ).toMatchObject({ browser: 'brave' });
  });

  it('describes a device that says nothing as a browser it cannot name', () => {
    expect(identifyDevice({ userAgent: undefined })).toEqual({
      app: 'browser',
      system: null,
      form: null,
      browser: null,
      inApp: null,
      maker: null,
      model: null,
      name: null,
    });
  });

  it('takes an older television app for the television its networking library runs on', () => {
    expect(
      identifyDevice({ userAgent: 'okhttp/4.12.0', kind: 'tv', hints: { name: 'Living Room' } }),
    ).toMatchObject({ app: 'tv', system: 'androidTv', form: 'tv', name: 'Living Room' });
    expect(
      identifyDevice({ userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0', kind: 'tv' }),
    ).toMatchObject({ app: 'tv', system: 'tvos', form: 'tv' });
  });

  it('drops the system an older Android app wrote after its name, wherever the name came from', () => {
    expect(
      identifyDevice({
        userAgent: 'okhttp/4.12.0',
        kind: 'phone',
        hints: { name: 'Pixel 9 on Android' },
      }),
    ).toMatchObject({ system: 'android', name: 'Pixel 9' });
  });
});
