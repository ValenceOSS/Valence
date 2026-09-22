import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValencePhone/components/AFace/thePictureFor';
import { Words } from '@ValencePhone/components/Words/Words';
import type { AFaceProps } from './AFace.types';

const SIDE = 96;

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 8, width: SIDE },
  initial: { color: '#ffffff', fontSize: 38, fontWeight: '600' },
  picture: { height: '100%', width: '100%' },
  tile: {
    alignItems: 'center',
    borderRadius: 20,
    height: SIDE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SIDE,
  },
});

/**
 * Draws what somebody looks like on the way in — their picture where they have one, and the first
 * letter of their name where they have not.
 *
 * A picture the server cannot produce falls back to the initial, the same way the browser client
 * does and for the same reason: a face says it has one whenever a filename is stored against it,
 * and the file behind that name can be gone.
 *
 * The initial is drawn white rather than in the theme's ink, because it sits on the colour the
 * profile chose and that colour is the same in both themes.
 *
 * @param profile - Whose face to draw.
 */
const AFace = ({ profile }: AFaceProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const showsPicture = profile.avatar.kind !== 'initial' && !isMissing;

  return (
    <View style={styles.face}>
      <View
        style={[styles.tile, { backgroundColor: showsPicture ? 'transparent' : profile.colour }]}
      >
        {showsPicture ? (
          <Image
            style={styles.picture}
            source={{ uri: thePictureFor(profile) }}
            onError={() => {
              setIsMissing(true);
            }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Words>{profileInitial(profile.name)}</Words>
        )}
      </View>

      <Words size="small" lines={1}>
        {profile.name}
      </Words>
    </View>
  );
};

AFace.displayName = 'AFace';

export { AFace };
