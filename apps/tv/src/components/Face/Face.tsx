import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { profileAvatarUrl, profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { FaceProps } from './Face.types';

/**
 * What a profile looks like — their photograph, their drawn face, or their initial on their colour.
 *
 * A picture the server cannot produce falls back to the initial, as it does on the web, rather than
 * leaving an empty circle where a face should be.
 *
 * @param profile - Whose face to draw.
 * @param size - How wide it is.
 * @param isFocused - Whether the remote is on it, which rings it in white. Square with small corners, as the web draws a face.
 * @param isRound - Whether it is drawn round, as it is in the bar along the top.
 */
const Face = ({ profile, size, isFocused = false, isRound = false }: FaceProps) => {
  const ring = { width: size, height: size, borderRadius: isRound ? size / 2 : tokens.radii.md };
  const [isMissing, setIsMissing] = useState(false);

  return (
    <View
      style={[styles.face, ring, { backgroundColor: profile.colour }, isFocused && styles.focused]}
    >
      {profile.avatar.kind === 'initial' || isMissing ? (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
          {profileInitial(profile.name)}
        </Text>
      ) : (
        <Image
          source={{ uri: onTheServer(profileAvatarUrl(profile)), headers: signedHeaders() }}
          style={ring}
          contentFit="cover"
          onError={() => {
            setIsMissing(true);
          }}
        />
      )}
    </View>
  );
};

Face.displayName = 'Face';

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  focused: { borderWidth: 6, borderColor: tokens.colours.text },
  initial: { color: tokens.colours.onAccent, fontWeight: '700' },
});

export { Face };
