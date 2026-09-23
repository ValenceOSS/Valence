import { Image, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import type { APictureProps } from './APicture.types';

const styles = StyleSheet.create({
  whole: { height: '100%', width: '100%' },
});

/**
 * A picture from the server, filling whatever holds it.
 *
 * A drawn face is a vector the server draws, which `Image` cannot read, so it is handed to the
 * drawing library the icons already use, as a browser hands one to an `img`.
 *
 * @param picture - Where it is, and whether it is drawn.
 * @param onMissing - Told it could not be read.
 */
const APicture = ({ picture, onMissing }: APictureProps) =>
  picture.isDrawn ? (
    <SvgUri uri={picture.uri} width="100%" height="100%" onError={onMissing} />
  ) : (
    <Image
      style={styles.whole}
      source={{ uri: picture.uri }}
      onError={onMissing}
      accessibilityIgnoresInvertColors
    />
  );

APicture.displayName = 'APicture';

export { APicture };
