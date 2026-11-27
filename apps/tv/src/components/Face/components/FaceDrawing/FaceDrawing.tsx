import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useDrawing } from '@ValenceClient/profiles/useDrawing';
import type { FaceDrawingProps } from './FaceDrawing.types';

/**
 * A face the server draws as a vector, which the image loader cannot read, drawn by the same library
 * the icons are and filling the face it is in.
 *
 * @param uri - Where the drawing is.
 * @param onMissing - Told it could not be read.
 * @param onLoad - Told it has been read.
 */
const FaceDrawing = ({ uri, onMissing, onLoad }: FaceDrawingProps) => {
  const xml = useDrawing(uri, { onLoad, onMissing });

  return xml === null ? null : (
    <View style={StyleSheet.absoluteFill}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
};

FaceDrawing.displayName = 'FaceDrawing';

export { FaceDrawing };
