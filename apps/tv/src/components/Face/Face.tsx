import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { facePaint } from '@ValenceClient/profiles/facePaint';
import { facePictureOf } from '@ValenceClient/profiles/facePictureOf';
import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { LETTER_INKS } from '@ValenceNative/library/LETTER_INKS';
import { paintStyleOf } from '@ValenceNative/pictures/paintStyleOf';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { pictureSource } from '@ValenceTv/platform/pictureSource';
import { tokens } from '@ValenceTv/theme/tokens';
import { FaceDrawing } from '@ValenceTv/components/Face/components/FaceDrawing/FaceDrawing';
import type { FaceProps } from './Face.types';

const BEHIND_A_PICTURE = 0.06;

/**
 * What a profile looks like — their photograph, their drawn face, the picture of their orb or
 * sketch, or their initial on their colour.
 *
 * A drawn face is read from the drawing itself, which needs nobody signed in, and drawn as a vector,
 * as the phone draws one, since the image loader cannot read the server's vectors and left those
 * faces empty. Until a picture has been read the face shows its colour and initial, and a picture
 * the server cannot produce leaves them there, as on the web. The letter is written in dark or light
 * ink by whichever reads on the colour, as the web writes it.
 *
 * @param profile - Whose face to draw.
 * @param size - How wide it is.
 * @param isFocused - Whether the remote is on it, which rings it in white. Square with small corners, as the web draws a face.
 * @param isRound - Whether it is drawn round, as it is in the bar along the top.
 */
const Face = ({ profile, size, isFocused = false, isRound = false }: FaceProps) => {
  const { avatar } = profile;
  const found = facePictureOf(profile);
  const isOnColour = avatar.kind === 'drawn' && avatar.isOnColour === true;
  const uri =
    found === null
      ? null
      : onTheServer(
          avatar.kind === 'drawn'
            ? drawingToShow(avatar.style, avatar.seed, isOnColour ? profile.colour : null)
            : found.path,
        );
  const [seen, setSeen] = useState<{ uri: string; state: 'here' | 'missing' } | null>(null);
  const state = seen?.uri === uri ? seen.state : null;
  const isShowing = uri !== null && state === 'here';
  const colourTo = avatar.kind === 'initial' ? avatar.colourTo : null;
  const corner = isRound ? size / 2 : tokens.radii.md;

  /**
   * Notes what became of the picture being read.
   *
   * @param now - Whether it was read or could not be.
   */
  const tell = (now: 'here' | 'missing') => {
    if (uri !== null) {
      setSeen({ uri, state: now });
    }
  };

  return (
    <View
      style={[
        styles.face,
        { width: size, height: size, borderRadius: corner },
        isShowing
          ? {
              backgroundColor: isOnColour
                ? profile.colour
                : withAlpha(tokens.colours.text, BEHIND_A_PICTURE),
            }
          : paintStyleOf(profile.colour, colourTo),
        isFocused && styles.focused,
      ]}
    >
      {isShowing ? null : (
        <Text
          style={[
            styles.initial,
            {
              fontSize: size * 0.42,
              color: LETTER_INKS[facePaint(profile.colour, colourTo).ink],
            },
          ]}
        >
          {profileInitial(profile.name)}
        </Text>
      )}

      {uri === null || found === null || state === 'missing' ? null : found.isDrawn ? (
        <FaceDrawing
          uri={uri}
          onLoad={() => {
            tell('here');
          }}
          onMissing={() => {
            tell('missing');
          }}
        />
      ) : (
        <Image
          source={pictureSource(uri, signedHeaders())}
          style={[StyleSheet.absoluteFill, { borderRadius: corner }]}
          contentFit="cover"
          onLoad={() => {
            tell('here');
          }}
          onError={() => {
            tell('missing');
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
  initial: { fontWeight: '700' },
});

export { Face };
