const KEY = 'valence-landing-theme';

/**
 * Remembers the theme the visitor chose, so the next page and the next visit open in it. Where the
 * browser refuses storage the choice simply lasts until the page is closed.
 *
 * @param theme - Light or dark.
 */
const keepSiteTheme = (theme: 'light' | 'dark'): void => {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    return;
  }
};

export { keepSiteTheme };
