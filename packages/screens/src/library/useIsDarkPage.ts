import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';

/**
 * Whether the page is dark: the theme somebody chose, or else what their system prefers.
 *
 * @returns Whether it is dark.
 */
const useIsDarkPage = (): boolean => {
  const prefersDark = useMatchesMedia('(prefers-color-scheme: dark)');
  const chosen =
    typeof document === 'undefined' ? null : document.documentElement.getAttribute('data-theme');

  return chosen === 'dark' || (chosen !== 'light' && prefersDark);
};

export { useIsDarkPage };
