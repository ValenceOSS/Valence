import { StyleSheet } from 'react-native';
import type { Animated } from 'react-native';

const WIDER_BY = 140 / 132;

const FALLS_FROM = 0.55;

/**
 * The styles that draw Valence's mark as three tinted pictures in a box of the given size: the mark
 * fitted inside the box, and each layer faded and lifted by how far it has dropped into place.
 *
 * @param width - How wide the box is.
 * @param height - How tall the box is.
 * @param layers - How far each layer has dropped, base first, from 0 to 1.
 * @param ink - The colour of the mark, as `#rrggbb`.
 * @returns The box's style, the mark's own frame inside it, and one style per layer, base first.
 */
const layersStylesOf = (
  width: number,
  height: number,
  layers: readonly Animated.Value[],
  ink: string,
) => {
  const high = Math.min(height, width / WIDER_BY);
  const wide = high * WIDER_BY;

  return {
    box: { width, height, alignItems: 'center', justifyContent: 'center' } as const,
    frame: { width: wide, height: high },
    layers: layers.map((fall) => [
      StyleSheet.absoluteFill,
      {
        width: wide,
        height: high,
        tintColor: ink,
        opacity: fall,
        transform: [
          {
            translateY: fall.interpolate({
              inputRange: [0, 1],
              outputRange: [-high * FALLS_FROM, 0],
            }),
          },
        ],
      },
    ]),
  };
};

export { layersStylesOf };
