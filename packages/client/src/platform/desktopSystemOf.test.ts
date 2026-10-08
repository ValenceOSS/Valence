import { describe, expect, it } from 'vitest';
import { desktopSystemOf } from '@ValenceClient/platform/desktopSystemOf';

describe('desktopSystemOf', () => {
  it.each([
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
      'mac',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0',
      'windows',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0', 'linux'],
  ] as const)('knows the computer from %s', (userAgent, system) => {
    expect(desktopSystemOf(userAgent)).toBe(system);
  });

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
    'Mozilla/5.0 (X11; CrOS x86_64 16181.0.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
    'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 Chrome/120.0 Edg/120.0',
  ])('offers nothing to a phone, a Chromebook or a television: %s', (userAgent) => {
    expect(desktopSystemOf(userAgent)).toBeNull();
  });

  it('tells an iPad that says it is a Mac apart by its touch screen', () => {
    expect(
      desktopSystemOf(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 Safari/605.1.15',
        5,
      ),
    ).toBeNull();
  });
});
