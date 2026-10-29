import { afterEach, describe, expect, it, vi } from 'vitest';
import { windowBarHeight } from './windowBarHeight';

describe('windowBarHeight', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--valence-window-bar');
    document.documentElement.style.removeProperty('font-size');
  });

  it('is nothing where no bar has been set', () => {
    expect(windowBarHeight()).toBe(0);
  });

  it('is nothing where there is no page, as when drawn on a server', () => {
    vi.stubGlobal('document', undefined);
    const height = windowBarHeight();

    vi.unstubAllGlobals();

    expect(height).toBe(0);
  });

  it('reads a height given in pixels', () => {
    document.documentElement.style.setProperty('--valence-window-bar', '36px');

    expect(windowBarHeight()).toBe(36);
  });

  it('turns a height given in rem into pixels against the root font size', () => {
    document.documentElement.style.setProperty('--valence-window-bar', '2.25rem');
    document.documentElement.style.setProperty('font-size', '16px');

    expect(windowBarHeight()).toBe(36);
  });
});
