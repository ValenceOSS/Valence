import { describe, expect, it } from 'vitest';
import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager';

const SAMSUNG =
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.0 TV Safari/537.36';

const XBOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

const ANOTHER =
  'Mozilla/5.0 (Linux; SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36';

const VIDAA =
  'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.146 Odin/111.5563.5.1 Safari/537.36 Model/VIDAA-MTK9603 VIDAA/9.0(Hisense;SmartTV;65A60LXVT;MTK9603/V0000.09.01W.P0714;UHD;65A6N;)';

const TITAN =
  'Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.4147.62 Safari/537.36 OPR/46.0.2207.0 OMI/4.24, TV_NT72690_2025_4K /0.1.2 (Philips, 55PUS8500, wired) CE-HTML/1.0 NETTV/4.6.0.8 SignOn/2.0 SmartTvA/5.0.0 TitanOS/3.0 en Ginga';

const VESTEL =
  'Mozilla/5.0 (Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 OPR/46.0.2207.0 OMI/4.22.1.32.LIMA.200 Model/Vestel-MB190 HbbTV/1.6.1 (+DRM; JVC; MB190; 1.48.12.1; _TV__2022; ) SmartTvA/3.0.0';

const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

describe('tvBrowserOf', () => {
  it('knows LG’s browser, though it calls itself a smart TV as well', () => {
    expect(tvBrowserOf(LG)).toBe('lgTv');
  });

  it('knows Samsung’s browser', () => {
    expect(tvBrowserOf(SAMSUNG)).toBe('samsungTv');
  });

  it('knows an Xbox’s browser, which runs Edge', () => {
    expect(tvBrowserOf(XBOX)).toBe('xbox');
  });

  it('knows the browsers on Hisense’s VIDAA, Titan OS and Vestel-made sets', () => {
    expect(tvBrowserOf(VIDAA)).toBe('smartTv');
    expect(tvBrowserOf(TITAN)).toBe('smartTv');
    expect(tvBrowserOf(VESTEL)).toBe('smartTv');
  });

  it('calls another maker’s television browser a smart TV', () => {
    expect(tvBrowserOf(ANOTHER)).toBe('smartTv');
  });

  it('says nothing of a browser that is not a television’s', () => {
    expect(tvBrowserOf(DESKTOP)).toBeNull();
  });
});
