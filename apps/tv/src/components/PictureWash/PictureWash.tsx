import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { usePictureLights } from '@ValenceTv/native/usePictureLights';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import { WashLayer } from './components/WashLayer/WashLayer';
import type { PictureLight } from '@ValenceTv/native/PictureLight';
import type { PictureWashProps } from './PictureWash.types';

const CROSSFADES_MS = 900;

/**
 * A picture softened into a wash of its colours, filling whatever holds it, crossfading as it
 * changes.
 *
 * tvOS blurs the picture as far as it is asked. Android's picture blur stops far short of that,
 * leaving the picture's own shape showing with hard, stepped edges, so there the picture's colours
 * are read instead — a grid of them, four across and three down — and each laid over the page as a
 * soft glow where it came from, the new picture's glows fading in over the last one's once they have
 * been read.
 *
 * @param path - The picture, on the server.
 * @param blur - How far tvOS blurs it, in points.
 * @param style - How it is drawn over what holds it: its opacity, or a scale past its edges.
 */
const PictureWash = ({ path, blur, style }: PictureWashProps) => {
  const url = onTheServer(path);
  const headers = signedHeadersFor(path);
  const lights = usePictureLights(Platform.OS === 'android' ? url : null, headers);
  const [layers, setLayers] = useState<{ under: PictureLight[] | null; over: PictureLight[] }>({
    under: null,
    over: [],
  });

  if (lights.length > 0 && lights !== layers.over) {
    setLayers({ under: layers.over.length > 0 ? layers.over : null, over: lights });
  }

  if (Platform.OS === 'android') {
    return (
      <View style={[StyleSheet.absoluteFill, style]}>
        {layers.under === null ? null : <WashLayer lights={layers.under} isArriving={false} />}
        {layers.over.length === 0 ? null : (
          <WashLayer
            key={layers.over.map((light) => light.colour).join('|')}
            lights={layers.over}
            isArriving
          />
        )}
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={{ uri: url, headers }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={blur}
        cachePolicy="memory-disk"
        transition={{ duration: CROSSFADES_MS, effect: 'cross-dissolve' }}
      />
    </View>
  );
};

PictureWash.displayName = 'PictureWash';

export { PictureWash };
