import { describe, expect, it } from 'vitest';
import { runsTheWebApp } from '@ValenceCore/functions/runsTheWebApp';

const LG_2022 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36 WebAppManager';

const LG_2025 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/120.0.6099.270 Safari/537.36 WebAppManager';

const XBOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

describe('runsTheWebApp', () => {
  it('says a television on a Chromium older than the web app is built for cannot', () => {
    expect(runsTheWebApp(LG_2022)).toBe(false);
  });

  it('lets a television on a current Chromium run it', () => {
    expect(runsTheWebApp(LG_2025)).toBe(true);
    expect(runsTheWebApp(XBOX)).toBe(true);
  });

  it('takes any other browser to be current', () => {
    expect(runsTheWebApp(DESKTOP)).toBe(true);
    expect(runsTheWebApp('Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/141.0')).toBe(true);
  });
});
