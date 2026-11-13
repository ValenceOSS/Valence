import type { ViewStyle } from 'react-native';
import { facePaint } from '@ValenceClient/profiles/facePaint';

/**
 * The style a colour, or a gradient from it to a second, is painted with on a phone, as the web
 * paints a letter face.
 *
 * @param colour - The colour, or where the gradient starts.
 * @param colourTo - Where the gradient ends, or nothing for the one colour.
 * @returns The style.
 */
const paintStyleOf = (colour: string, colourTo: string | null | undefined): ViewStyle => {
  const { style } = facePaint(colour, colourTo);

  return {
    backgroundColor: style.backgroundColor ?? colour,
    ...(style.backgroundImage === undefined
      ? {}
      : { experimental_backgroundImage: style.backgroundImage }),
  };
};

export { paintStyleOf };
