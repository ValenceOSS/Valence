import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';
import { useTheme } from '@ValenceClient/shell/useTheme';

/**
 * Whether the page is dark: the theme somebody chose, or else what their system prefers, answered
 * again whenever either changes.
 *
 * @returns Whether it is dark.
 */
const useIsDarkPage = (): boolean => {
  const prefersDark = useMatchesMedia('(prefers-color-scheme: dark)');
  const { theme } = useTheme();

  return theme === 'dark' || (theme === 'system' && prefersDark);
};

export { useIsDarkPage };
