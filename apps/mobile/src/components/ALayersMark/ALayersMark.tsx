import { Animated, View } from 'react-native';
import { layersStylesOf } from '@ValenceNative/brand/layersStylesOf';
import { useLayersStacking } from '@ValenceNative/motion/useLayersStacking';
import base from '@ValenceMobile/assets/valence-layer-base.png';
import middle from '@ValenceMobile/assets/valence-layer-middle.png';
import top from '@ValenceMobile/assets/valence-layer-top.png';
import type { ALayersMarkProps } from './ALayersMark.types';

const PICTURES = [base, middle, top] as const;

/**
 * Valence's mark, three layers each cut with a V, inked in the colour given and fitted into the box
 * it is handed. Animated, the layers drop in base first and settle into one stack, as the web's
 * splash does; looping, they lift away top first and stack again while the app loads.
 *
 * @param width - How wide the box it sits in is.
 * @param height - How tall the box is.
 * @param ink - The colour of the mark, as `#rrggbb`.
 * @param isAnimated - Whether the layers drop in as it arrives.
 * @param loops - Whether it goes on stacking and lifting away, as it does while the app loads.
 * @param label - What it is read out as; omit where a name sits beside it.
 */
const ALayersMark = ({
  width,
  height,
  ink,
  isAnimated = false,
  loops = false,
  label,
}: ALayersMarkProps) => {
  const styles = layersStylesOf(
    width,
    height,
    useLayersStacking({ arrives: isAnimated, loops }),
    ink,
  );

  return (
    <View
      style={styles.box}
      {...(label === undefined
        ? {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label })}
    >
      <View style={styles.frame}>
        {PICTURES.map((picture, at) => (
          <Animated.Image
            key={at.toString()}
            source={picture}
            resizeMode="contain"
            style={styles.layers[at]}
          />
        ))}
      </View>
    </View>
  );
};

ALayersMark.displayName = 'ALayersMark';

export { ALayersMark };
