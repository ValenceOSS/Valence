import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeThisBrowser } from './describeThisBrowser';

const claimingToBe = (userAgent: string): void => {
  vi.stubGlobal('navigator', { userAgent });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('describeThisBrowser', () => {
  it('names the browser and the machine it is running on', () => {
    claimingToBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36');

    expect(describeThisBrowser()).toBe('Chromium on macOS');
  });

  it('names Chrome where the browser’s client hints say it is Google Chrome', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/154.0.0.0 Safari/537.36',
      userAgentData: { brands: [{ brand: 'Not A(Brand' }, { brand: 'Google Chrome' }] },
    });

    expect(describeThisBrowser()).toBe('Chrome on macOS');
  });

  it('reads whatever this browser says about itself, rather than a fixed answer', () => {
    claimingToBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0');

    expect(describeThisBrowser()).toBe('Firefox on Windows');
  });

  it('still answers where the browser says nothing useful', () => {
    claimingToBe('');

    expect(describeThisBrowser()).toBe('Unknown browser');
  });

  it('names Valence opened from a home screen as the web app rather than the browser', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      standalone: true,
    });

    expect(describeThisBrowser()).toBe('Valence web app on iOS');
  });

  it('names Brave where Brave calls itself Chrome', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36',
      brave: {},
    });

    expect(describeThisBrowser()).toBe('Brave on Windows');
  });
});
