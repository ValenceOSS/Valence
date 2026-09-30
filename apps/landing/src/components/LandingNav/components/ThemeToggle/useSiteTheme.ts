import { useSyncExternalStore } from 'react';

/**
 * Reads the theme set on the page right now.
 *
 * @returns Light or dark.
 */
const themeNow = (): 'light' | 'dark' =>
  document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

/**
 * Tells a listener whenever the page's theme changes, whoever changed it.
 *
 * @param onChange - Told on each change.
 * @returns A way to stop listening.
 */
const followTheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return () => {
    observer.disconnect();
  };
};

/**
 * Which theme the site is showing, kept current as the toggle in the bar changes it, so anything
 * drawn differently in the two can follow.
 *
 * @returns Light or dark.
 */
const useSiteTheme = (): 'light' | 'dark' =>
  useSyncExternalStore(followTheme, themeNow, () => 'dark');

export { useSiteTheme };
