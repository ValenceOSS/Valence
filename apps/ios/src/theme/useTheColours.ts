import { useColorScheme } from 'react-native';
import { theColours } from '@ValencePhone/theme/theColours';
import { theThemeToDrawIn } from '@ValencePhone/theme/theThemeToDrawIn';
import type { Colours } from '@ValencePhone/theme/theColours';

/**
 * The colours to draw with, following whichever theme the phone is in.
 *
 * The same values the browser client is drawn from, converted once: a household that opens Valence
 * on a laptop and a phone should be looking at one product, and two palettes that drift apart is
 * how it stops being one. A phone that will not say which theme it is in is drawn dark, which is
 * what a room with a film playing in it wants.
 *
 * @returns The palette for this theme.
 */
const useTheColours = (): Colours => theColours[theThemeToDrawIn(useColorScheme())];

export { useTheColours };
