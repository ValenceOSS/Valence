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

const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

describe('isATvBrowser', () => {
  it('shows the TV layout to an LG or Samsung browser on Chromium 84 or later', () => {
    expect(isATvBrowser(LG_2022)).toBe(true);
    expect(isATvBrowser(SAMSUNG_2021)).toBe(true);
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
