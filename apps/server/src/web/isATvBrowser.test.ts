import { describe, expect, it } from 'vitest';
import { isATvBrowser } from './isATvBrowser';

const LG_2022 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager';

const LG_2021 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager';

const SAMSUNG_2021 =
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36 Chrome/85.0.4183.93';

const SAMSUNG_AS_IT_SAYS =
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36';

const SAMSUNG_2020 =
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106.1/5.5 TV Safari/537.36';

const XBOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

const VIDAA_2023 =
  'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.146 Odin/111.5563.5.1 Safari/537.36 Model/VIDAA-MTK9603 VIDAA/9.0(Hisense;SmartTV;65A60LXVT;MTK9603/V0000.09.01W.P0714;UHD;65A6N;)';

const TITAN_2025 =
  'Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.4147.62 Safari/537.36 OPR/46.0.2207.0 OMI/4.24, TV_NT72690_2025_4K /0.1.2 (Philips, 55PUS8500, wired) CE-HTML/1.0 NETTV/4.6.0.8 SignOn/2.0 SmartTvA/5.0.0 TitanOS/3.0 en Ginga';

const VESTEL_2020 =
  'Mozilla/5.0 (Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36 OPR/46.0.2207.0 OMI/4.20.5.61.LIMA.148 Model/Vestel-MB181 HbbTV/1.5.1 (+DRM; JVC; MB181; 1.48.12.1; _TV__2020; ) SmartTvA/3.0.0';

const LG_BROWSER_2022 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36 LG Browser/8.00.00(LGE; 65UR80006LJ; 03.31.60; 0x00000001; DTV_W23A); webOS.TV-2022';

const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

describe('isATvBrowser', () => {
  it('shows the TV layout to an LG or Samsung browser on Chromium 84 or later', () => {
    expect(isATvBrowser(LG_2022)).toBe(true);
    expect(isATvBrowser(SAMSUNG_2021)).toBe(true);
  });

  it('shows it to an Xbox’s Edge too', () => {
    expect(isATvBrowser(XBOX)).toBe(true);
  });

  it('shows it to Hisense’s VIDAA and Titan OS on a Chromium new enough', () => {
    expect(isATvBrowser(VIDAA_2023)).toBe(true);
    expect(isATvBrowser(TITAN_2025)).toBe(true);
  });

  it('leaves a Vestel-made set on an older Chromium on the web app', () => {
    expect(isATvBrowser(VESTEL_2020)).toBe(false);
  });

  it('reads the version LG’s own browser gives, spelling Chrome with a zero', () => {
    expect(isATvBrowser(LG_BROWSER_2022)).toBe(true);
  });

  it('reads the Chromium version Samsung gives without naming Chromium', () => {
    expect(isATvBrowser(SAMSUNG_AS_IT_SAYS)).toBe(true);
  });

  it('leaves an older television’s browser on the web app', () => {
    expect(isATvBrowser(LG_2021)).toBe(false);
    expect(isATvBrowser(SAMSUNG_2020)).toBe(false);
  });

  it('leaves every other browser on the web app', () => {
    expect(isATvBrowser(DESKTOP)).toBe(false);
    expect(isATvBrowser(undefined)).toBe(false);
  });
});
