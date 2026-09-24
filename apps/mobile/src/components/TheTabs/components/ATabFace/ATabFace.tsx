import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ATabFaceProps } from './ATabFace.types';

const SIDE = 24;

const RING = 2;

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    borderRadius: SIDE / 2,
    height: SIDE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SIDE,
  },
  initial: { color: '#ffffff', fontFamily: FONTS.sans.bold, fontSize: 12 },
  ring: { borderRadius: SIDE / 2 + RING * 2, borderWidth: RING, padding: RING },
});

/**
 * The viewer's face in place of a tab's icon, ringed while that tab is showing.
 *
 * @param face - Their picture, or the initial and colour to draw instead.
 * @param isShowing - Whether the tab is the one showing.
 */
const ATabFace = ({ face, isShowing }: ATabFaceProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  return (
    <View style={[styles.ring, { borderColor: isShowing ? colours.accent : 'transparent' }]}>
      <View style={[styles.face, { backgroundColor: face.backdrop }]}>
        {face.picture === null || isMissing ? (
          <Text style={styles.initial}>{face.initial}</Text>
        ) : (
          <APicture
            picture={face.picture}
            onMissing={() => {
              setIsMissing(true);
            }}
          />
        )}
      </View>
    </View>
  );
};

ATabFace.displayName = 'ATabFace';

export { ATabFace };
