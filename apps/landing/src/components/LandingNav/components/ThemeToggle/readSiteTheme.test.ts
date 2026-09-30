import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSiteTheme } from './readSiteTheme';

const prefers = (isLight: boolean) => {
  vi.stubGlobal('matchMedia', () => ({
    matches: isLight,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
};

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('readSiteTheme', () => {
  it('opens in the theme the visitor last chose', () => {
    prefers(false);
    window.localStorage.setItem('valence-landing-theme', 'light');

    expect(readSiteTheme()).toBe('light');
  });

  it('follows the system when nothing was chosen', () => {
    prefers(true);

    expect(readSiteTheme()).toBe('light');
  });

  it('opens dark when the system prefers dark', () => {
    prefers(false);

    expect(readSiteTheme()).toBe('dark');
  });

  it('ignores a stored value it does not recognise', () => {
    prefers(false);
    window.localStorage.setItem('valence-landing-theme', 'purple');

    expect(readSiteTheme()).toBe('dark');
  });
});
