import { describe, expect, it } from 'vitest';
import { detectPlatform } from './detectPlatform';

describe('detectPlatform', () => {
  it.each([
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36', 'android'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)', 'iphone'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15', 'mac'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'windows'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'linux'],
    ['Mozilla/5.0 (X11; CrOS x86_64 16181.0.0)', 'linux'],
    ['SomethingElse/1.0', 'unknown'],
  ] as const)('reads %s as %s', (userAgent, platform) => {
    expect(detectPlatform({ userAgent })).toBe(platform);
  });

  it('tells an iPad that says it is a Mac apart by its touch screen', () => {
    expect(
      detectPlatform({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      }),
    ).toBe('iphone');
  });

  it('trusts the browser’s own platform hint over its user agent', () => {
    expect(
      detectPlatform({ userAgent: 'Mozilla/5.0', userAgentData: { platform: 'Windows' } }),
    ).toBe('windows');
  });
});
