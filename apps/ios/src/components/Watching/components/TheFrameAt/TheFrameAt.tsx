import { Image, StyleSheet, View } from 'react-native';
import { thumbnailAt } from '@ValenceClient/playback/fetchTrickplay';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { TheFrameAtProps } from './TheFrameAt.types';

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#000000',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

/**
 * The moment of the film at a point on the scrubber, cut from the sheet of thumbnails the server
 * made of it, as the web shows above its scrubber.
 *
 * A sheet holds many moments side by side, so it is drawn whole at the frame's scale and shifted so
 * that only the one wanted shows through.
 *
 * @param trickplay - The film's thumbnails.
 * @param seconds - Which moment.
 * @param wide - How wide to draw it.
 */
const TheFrameAt = ({ trickplay, seconds, wide }: TheFrameAtProps) => {
  const thumbnail = thumbnailAt(trickplay.thumbnails, seconds);

  if (thumbnail === null || thumbnail.width === 0) {
    return null;
  }

  const onTheSheet = trickplay.thumbnails.filter((one) => one.sheetUrl === thumbnail.sheetUrl);
  const sheetWide = Math.max(...onTheSheet.map((one) => one.x + one.width));
  const sheetHigh = Math.max(...onTheSheet.map((one) => one.y + one.height));
  const scale = wide / thumbnail.width;

  return (
    <View style={[styles.frame, { height: thumbnail.height * scale, width: wide }]}>
      <Image
        source={{ uri: onThisServer(thumbnail.sheetUrl) }}
        style={{
          height: sheetHigh * scale,
          left: -thumbnail.x * scale,
          position: 'absolute',
          top: -thumbnail.y * scale,
          width: sheetWide * scale,
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
};

TheFrameAt.displayName = 'TheFrameAt';

export { TheFrameAt };
