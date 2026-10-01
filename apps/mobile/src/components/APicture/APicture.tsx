import { StyleSheet } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ADrawing } from '@ValenceMobile/components/APicture/components/ADrawing/ADrawing';
import type { APictureProps } from './APicture.types';

const styles = StyleSheet.create({
  whole: { height: '100%', width: '100%' },
});

/**
 * A picture from the server, filling whatever holds it.
 *
 * A drawn face is a vector the server draws, which `Image` cannot read, so it is drawn by the
 * drawing library the icons already use, as a browser draws one in an `img`.
 *
 * @param picture - Where it is, and whether it is drawn.
 * @param onMissing - Told it could not be read.
 * @param onLoad - Told it has been read and drawn.
 */
const APicture = ({ picture, onMissing, onLoad }: APictureProps) =>
  picture.isDrawn ? (
    <ADrawing
      uri={picture.uri}
      onMissing={onMissing}
      {...(onLoad === undefined ? {} : { onLoad })}
    />
  ) : (
    <ARemotePicture
      style={styles.whole}
      uri={picture.uri}
      onMissing={onMissing}
      {...(onLoad === undefined ? {} : { onLoad })}
    />
  );

APicture.displayName = 'APicture';

export { APicture };
