import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValencePhone/components/AFace/thePictureFor';
import type { AFaceProps } from './AFace.types';

const SIDE = 96;

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 8, width: SIDE },
  tile: {
    alignItems: 'center',
    borderRadius: 16,
    height: SIDE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SIDE,
  },
  picture: { height: '100%', width: '100%' },
  initial: { color: '#ffffff', fontSize: 36, fontWeight: '600' },
  name: { color: '#f6fbf9', fontSize: 14 },
});

/**
 * Draws one of the faces on the way in — their picture where they have one, and the first letter
 * of their name where they have not.
 *
 * A picture the server cannot produce falls back to the initial, the same way the browser client
 * does and for the same reason: a face says it has one whenever a filename is stored against it,
 * and the file behind that name can be gone.
 *
 * @param profile - Whose face to draw.
 */
const AFace = ({ profile }: AFaceProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const showsPicture = profile.avatar.kind !== 'initial' && !isMissing;

  return (
    <View style={styles.face}>
      <View style={[styles.tile, { backgroundColor: showsPicture ? '#1a1a1a' : profile.colour }]}>
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
          <Text style={styles.initial}>{profileInitial(profile.name)}</Text>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {profile.name}
      </Text>
    </View>
  );
};

AFace.displayName = 'AFace';

export { AFace };
