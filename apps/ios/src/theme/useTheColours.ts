import { useColorScheme } from 'react-native';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { theColours } from '@ValencePhone/theme/theColours';
import { theThemeToDrawIn } from '@ValencePhone/theme/theThemeToDrawIn';
import type { Colours } from '@ValencePhone/theme/theColours';

/**
 * The colours to draw with.
 *
 * The same values the browser client is drawn from, converted once, and the same preference it
 * reads: a household that opens Valence on a laptop and a phone should be looking at one product,
 * and two palettes or two ideas of what somebody asked for is how it stops being one.
 *
 * @returns The palette to draw with.
 */
const useTheColours = (): Colours => {
  const { theme } = useTheme();

  return theColours[theThemeToDrawIn(theme, useColorScheme())];
};

export { useTheColours };
