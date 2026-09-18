import { describe, expect, it } from 'vitest';
import { detectClientKind } from './detectClientKind';

const TELEVISIONS = [
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 SamsungBrowser/4.0',
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/87 Safari/537.36 WebAppManager',
  'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7233) AppleWebKit/537.36 Chrome/70 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; Chromecast) AppleWebKit/537.36 CrKey/1.56 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; BRAVIA 4K GB) AppleWebKit/537.36 Chrome/81 Safari/537.36',
  'Roku/DVP-9.10 (049.10E04111A)',
  'Mozilla/5.0 (Linux; Android 11; Android TV) AppleWebKit/537.36 Chrome/94 Safari/537.36',
];

const NOT_TELEVISIONS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
];

describe('telling a television from anything else', () => {
  it.each(TELEVISIONS)('knows a television by %s', (userAgent) => {
    expect(detectClientKind(userAgent)).toBe('tv');
  });

  it.each(NOT_TELEVISIONS)('does not mistake %s for one', (userAgent) => {
    expect(detectClientKind(userAgent)).toBe('browser');
  });

  it('calls something it has never seen a browser rather than guessing', () => {
    expect(detectClientKind('')).toBe('browser');
  });
});
