const KEY = 'valence-landing-theme';

/**
 * Asks the system whether it prefers light, where the browser can say; one that cannot is taken to
 * prefer dark, which is how the site is drawn by default.
 *
 * @returns Whether the system prefers light.
 */
const prefersLight = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: light)').matches;

/**
 * Reads which theme the site should open in: the one the visitor last chose here, or, if they never
 * chose, whatever their system prefers.
 *
 * @returns Light or dark.
 */
const readSiteTheme = (): 'light' | 'dark' => {
  try {
    const kept = window.localStorage.getItem(KEY);

    if (kept === 'light' || kept === 'dark') {
      return kept;
    }
  } catch {
    return prefersLight() ? 'light' : 'dark';
  }

  return prefersLight() ? 'light' : 'dark';
};

export { readSiteTheme };
