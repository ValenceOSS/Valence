import { describe, expect, it } from 'vitest';
import { needsIdrKeyframes } from '@ValenceClient/playback/needsIdrKeyframes';

describe('needsIdrKeyframes', () => {
  it.each([
    [
      'Firefox on macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:159.0) Gecko/20100101 Firefox/159.0',
    ],
    [
      'Firefox on Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:159.0) Gecko/20100101 Firefox/159.0',
    ],
    ['Firefox on Android', 'Mozilla/5.0 (Android 15; Mobile; rv:159.0) Gecko/159.0 Firefox/159.0'],
  ])('is true for %s', (_name, userAgent) => {
    expect(needsIdrKeyframes(userAgent)).toBe(true);
  });

  it.each([
    [
      'Chrome',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    ],
    [
      'Safari',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15',
    ],
    [
      'Valence for desktop',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Valence/1.9.0 Chrome/148.0.0.0 Electron/41.0.0 Safari/537.36',
    ],
    [
      'a television',
      'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 WebAppManager',
    ],
    ['nothing at all', ''],
  ])('is false for %s', (_name, userAgent) => {
    expect(needsIdrKeyframes(userAgent)).toBe(false);
  });
});
