import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import type { PictureWashProps } from './PictureWash.types';

const CROSSFADES_MS = 900;

const SHRUNK_BY = 8;

/**
 * A picture softened into a wash of its colours, for a television's browser, filling whatever holds
 * it and crossfading as it changes.
 *
 * A browser blurs by working over every pixel within the blur of each one, so a blur as wide as the
 * television's across the whole screen is about the heaviest thing a television's browser can be
 * asked to draw. The picture is drawn an eighth of the size instead, blurred an eighth as far, and
 * scaled up to fill: scaling up softens it further for nothing, and it comes out as the television's
 * wash does for a sixty-fourth of the work.
 *
 * @param path - The picture, on the server.
 * @param blur - How far the television blurs it, in points.
 * @param style - How it is drawn over what holds it: its opacity, or a scale past its edges.
 */
const PictureWash = ({ path, blur, style }: PictureWashProps) => (
  <View style={[StyleSheet.absoluteFill, styles.holds, style]}>
    <View style={styles.shrunk}>
      <Image
        source={{ uri: onTheServer(path) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={blur / SHRUNK_BY}
        cachePolicy="memory-disk"
        transition={{ duration: CROSSFADES_MS, effect: 'cross-dissolve' }}
      />
    </View>
  </View>
);

PictureWash.displayName = 'PictureWash';

const styles = StyleSheet.create({
  holds: { overflow: 'hidden' },
  shrunk: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '12.5%',
    height: '12.5%',
    transform: [{ scale: SHRUNK_BY }],
    transformOrigin: 'top left',
  },
});

export { PictureWash };
