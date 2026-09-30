import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useTheme } from '@ValenceClient/shell/useTheme';

/**
 * Tells the system which appearance somebody chose, so what the system draws for the app follows it
 * as the app's own colours do.
 *
 * Liquid glass, the tab bar, a sheet and the window behind everything are drawn by iOS in whatever
 * appearance the app is in, and without this the app is in the phone's: somebody who chose light
 * on a phone set to dark got light pages under dark glass. Choosing to follow the phone hands the
 * appearance back to it.
 */
const useTheChosenAppearance = (): void => {
  const { theme } = useTheme();

  useEffect(() => {
    Appearance.setColorScheme(theme === 'system' ? 'unspecified' : theme);
  }, [theme]);
};

export { useTheChosenAppearance };
