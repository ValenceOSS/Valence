import { afterEach, describe, expect, it } from 'vitest';
import { keepSiteTheme } from './keepSiteTheme';

afterEach(() => {
  window.localStorage.clear();
});

describe('keepSiteTheme', () => {
  it('remembers the chosen theme', () => {
    keepSiteTheme('light');

    expect(window.localStorage.getItem('valence-landing-theme')).toBe('light');
  });
});
