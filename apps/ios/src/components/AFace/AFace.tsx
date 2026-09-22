import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValencePhone/components/AFace/thePictureFor';
import { APicture } from '@ValencePhone/components/APicture/APicture';
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
 * @param picked - A photograph chosen on this phone and not yet sent, to show in its place.
 */
const AFace = ({ profile, picked = null }: AFaceProps) => {
  const [missing, setMissing] = useState<string | null>(null);
  const found = thePictureFor(profile, picked);
  const picture = found === null || found.uri === missing ? null : found;

  return (
    <View style={styles.face}>
      <View
        style={[
          styles.tile,
          { backgroundColor: picture?.isDrawn === false ? 'transparent' : profile.colour },
        ]}
      >
        {picture !== null ? (
          <APicture
            picture={picture}
            onMissing={() => {
              setMissing(picture.uri);
            }}
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
