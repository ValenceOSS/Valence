import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { Words } from '@ValenceMobile/components/Words/Words';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { AFaceProps } from './AFace.types';

const SIDE = 96;

const LARGE_SIDE = 136;

const ROUNDNESS = 0.06;

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 8 },
  initial: { color: '#ffffff', fontSize: 38, fontFamily: FONTS.sans.bold },
  largeInitial: { fontSize: 54 },
  picture: { height: '100%', width: '100%' },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
 * @param isLarge - Whether it is the one face on the screen, drawn larger and without its name, for a
 *   screen that names them itself.
 */
const AFace = ({ profile, picked = null, isLarge = false }: AFaceProps) => {
  const [missing, setMissing] = useState<string | null>(null);
  const found = thePictureFor(profile, picked);
  const picture = found === null || found.uri === missing ? null : found;
  const side = isLarge ? LARGE_SIDE : SIDE;

  return (
    <View style={[styles.face, { width: side }]}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: picture?.isDrawn === false ? 'transparent' : profile.colour,
            borderRadius: Math.round(side * ROUNDNESS),
            height: side,
            width: side,
          },
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
          <Text style={[styles.initial, isLarge && styles.largeInitial]}>
            {profileInitial(profile.name)}
          </Text>
        )}
      </View>

      {isLarge ? null : (
        <Words tone="muted" lines={1}>
          {profile.name}
        </Words>
      )}
    </View>
  );
};

AFace.displayName = 'AFace';

export { AFace };
