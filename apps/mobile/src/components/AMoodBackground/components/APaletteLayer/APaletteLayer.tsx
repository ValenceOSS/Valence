import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { bloomsOf } from '@ValenceMobile/components/AMoodBackground/components/APaletteLayer/bloomsOf';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { APaletteLayerProps } from './APaletteLayer.types';

const COMES_IN_OVER = 1200;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * One set of lights read from a picture, laid out as the web's mood background lays out its orbs —
 * a bloom of each colour where it was read, as strong as it is vivid and fainter towards the foot —
 * and drawn once, as one background, fading in as it arrives and out as the next set replaces it,
 * so the two cross rather than one being laid over the other and then taken away. While it fades it
 * is kept as one picture, so only how much of it shows changes from frame to frame.
 *
 * @param palette - The lights, in rows of six from the top.
 * @param isLeaving - Whether it is being replaced, and so fading out.
 * @param isThereAlready - Whether it was there when the background was drawn, and so is lit from the
 *   start rather than fading in.
 */
const APaletteLayer = ({ palette, isLeaving, isThereAlready = false }: APaletteLayerProps) => {
  const [shown] = useState(() => new Animated.Value(isThereAlready ? 1 : 0));
  const [isFading, setIsFading] = useState(!isThereAlready);
  const blooms = useMemo(() => bloomsOf(palette), [palette]);

  useEffect(() => {
    if (isThereAlready && !isLeaving) {
      return undefined;
    }

    setIsFading(true);

    const fading = Animated.timing(shown, {
      toValue: isLeaving ? 0 : 1,
      duration: COMES_IN_OVER,
      easing: EASINGS.inOutQuad,
      useNativeDriver: true,
    });

    fading.start(({ finished }) => {
      if (finished) {
        setIsFading(false);
      }
    });

    return () => {
      fading.stop();
    };
  }, [shown, isLeaving, isThereAlready]);

  return (
    <Animated.View
      style={[
        styles.fills,
        blooms === null ? null : { experimental_backgroundImage: blooms },
        { opacity: shown },
      ]}
      shouldRasterizeIOS={isFading}
      renderToHardwareTextureAndroid={isFading}
    />
  );
};

APaletteLayer.displayName = 'APaletteLayer';

export { APaletteLayer };
