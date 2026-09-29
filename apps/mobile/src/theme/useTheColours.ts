import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { theColours } from '@ValenceMobile/theme/theColours';
import { theThemeToDrawIn } from '@ValenceMobile/theme/theThemeToDrawIn';
import { coloursWithTheme } from '@ValenceMobile/plugins/coloursWithTheme';
import { keptPluginTheme } from '@ValenceClient/plugins/keptPluginTheme';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import type { Colours } from '@ValenceMobile/theme/theColours';

/**
 * The colours to draw with.
 *
 * The same values the browser client is drawn from, converted once, and the same preference it
 * reads: a household that opens Valence on a laptop and a phone should be looking at one product,
 * and two palettes or two ideas of what somebody asked for is how it stops being one. Where a
 * plugin theme was chosen on this phone, its colours are laid over Valence's for the scheme drawn.
 *
 * @returns The palette to draw with.
 */
const useTheColours = (): Colours => {
  const { theme } = useTheme();
  const scheme = theThemeToDrawIn(theme, useColorScheme());
  const plugin = keptPluginTheme(usePluginThemeChoice().choice);

  return useMemo(() => coloursWithTheme(theColours[scheme], plugin, scheme), [plugin, scheme]);
};

export { useTheColours };
