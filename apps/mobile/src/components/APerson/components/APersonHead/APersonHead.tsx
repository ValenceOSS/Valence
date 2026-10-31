import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { APersonHeadProps } from './APersonHead.types';

const TALL = 1.3;

const PORTRAIT_TALL = 1.5;

const FADES_FROM = 0.68;

const NAME_ABOVE_THE_FOOT = 0.01;

const UNDER_THE_CROSS = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 100%)';

const styles = StyleSheet.create({
  cross: { height: 110, left: 0, position: 'absolute', right: 0, top: 0 },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  name: { left: SCREEN_EDGE, position: 'absolute', right: SCREEN_EDGE },
  portrait: { left: 0, position: 'absolute', top: 0 },
  whole: { overflow: 'hidden' },
});

/**
 * The head of a card about somebody: their portrait edge to edge and held by its top, so the crop
 * takes their chest rather than their head, darkened a little under the way out, and fading near
 * its foot into the card's own colour, with their name set large across the very foot, below their
 * face.
 *
 * @param portraitUrl - Their portrait.
 * @param name - Their name.
 * @param ground - The colour the portrait fades into.
 */
const APersonHead = ({ portraitUrl, name, ground }: APersonHeadProps) => {
  const { width } = useWindowDimensions();
  const high = width * TALL;
  const intoTheCard = `linear-gradient(to bottom, ${withAlpha(ground, 0)} ${(FADES_FROM * 100).toString()}%, ${withAlpha(ground, 0.7)} 80%, ${ground} 100%)`;

  return (
    <View style={[styles.whole, { height: high }]}>
      <ARemotePicture
        style={[styles.portrait, { height: width * PORTRAIT_TALL, width }]}
        uri={portraitUrl}
        label={name}
      />

      <View
        pointerEvents="none"
        style={[styles.cross, { experimental_backgroundImage: UNDER_THE_CROSS }]}
      />

      <View
        pointerEvents="none"
        style={[styles.fills, { experimental_backgroundImage: intoTheCard }]}
      />

      <View style={[styles.name, { bottom: high * NAME_ABOVE_THE_FOOT }]}>
        <Words size="title" isCentred colour="#ffffff">
          {name}
        </Words>
      </View>
    </View>
  );
};

APersonHead.displayName = 'APersonHead';

export { APersonHead };
