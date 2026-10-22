import { describe, expect, it } from 'vitest';
import { describeDevice } from './describeDevice';

/**
 * Names a device in English, the way the tests compare it.
 *
 * @param userAgent - What the device sent.
 * @param brands - The brands its hints named.
 * @returns The name.
 */
const named = (...asked: Parameters<typeof describeDevice>): string =>
  describeDevice(...asked).message;

describe('describeDevice', () => {
  it('names the browser and the machine it is on', () => {
    expect(
      named(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        ['Not A(Brand', 'Google Chrome', 'Chromium'],
      ),
    ).toEqual('Chrome on macOS');
  });

  it('calls a browser built on Chromium Chromium where its hints do not name Google Chrome', () => {
    const chromium =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Safari/537.36';

    expect(named(chromium, ['Not A(Brand', 'Chromium'])).toEqual('Chromium on macOS');
    expect(named(chromium)).toEqual('Chromium on macOS');
    expect(named(chromium, ['Brave', 'Chromium'])).toEqual('Brave on macOS');
  });

  it('believes the most specific claim, since every browser claims to be several', () => {
    expect(
      named(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0',
      ),
    ).toEqual('Edge on Windows');
  });

  it('tells a phone from a desktop', () => {
    expect(
      named(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toEqual('Safari on iPhone');
  });

  it('names the machine alone where the browser is not one it knows', () => {
    expect(named('SomeTelevision/2.0 (Linux)')).toEqual('Linux');
  });

  it('admits it does not know rather than inventing a name', () => {
    expect(named('')).toEqual('Unknown device');
    expect(named(null)).toEqual('Unknown device');
    expect(named(undefined)).toEqual('Unknown device');
  });

  it('keeps a manageable amount of whatever it was told instead', () => {
    const said = named('x'.repeat(200));

    expect(said.length).toBeLessThanOrEqual(40);
  });

  it('names a television’s own browser as the television, not as the browsers it claims to be', () => {
    expect(
      named(
        'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36 WebAppManager',
      ),
    ).toBe('LG TV');
    expect(
      named(
        'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36',
      ),
    ).toBe('Samsung TV');
    expect(
      named(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      ),
    ).toBe('Xbox');
    expect(named('Chrome/111.0 Odin/111 VIDAA/9.0(Hisense;SmartTV;65A60LXVT;MTK9603;)')).toBe(
      'Hisense TV',
    );
  });

  it('names Valence’s own apps by the device they say they are on', () => {
    expect(named("Valence (Dan's iPhone)")).toEqual("Valence on Dan's iPhone");
    expect(named('Valence (Living Room)')).toEqual('Valence on Living Room');
  });

  it('tells the desktop app from the browser it is built on', () => {
    expect(
      named(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Valence/1.1.2 Chrome/140.0.0.0 Electron/38.0.0 Safari/537.36',
      ),
    ).toEqual('Valence desktop app on macOS');
  });

  it('names an app from before it said which device it was on as Valence, not its library', () => {
    expect(named('Valence/1 CFNetwork/3896.100.1.3.1 Darwin/25.0.0')).toEqual(
      'Valence on an Apple device',
    );
    expect(named('okhttp/4.12.0')).toEqual('Valence on Android');
  });
});
