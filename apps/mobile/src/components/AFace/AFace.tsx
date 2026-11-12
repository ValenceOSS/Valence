import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { profileAvatarUrl, profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { PICTURES_SEEN } from '@ValenceMobile/components/AFace/PICTURES_SEEN';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { AMovingFace } from '@ValenceMobile/components/AMovingFace/AMovingFace';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { Words } from '@ValenceMobile/components/Words/Words';
import { inkFor } from '@ValenceClient/library/inkFor';
import { LETTER_INKS } from '@ValenceNative/library/LETTER_INKS';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import type { ViewStyle } from 'react-native';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import type { AFaceProps } from './AFace.types';
import { backdropOfAFace } from '@ValenceMobile/components/AFace/backdropOfAFace';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { FACE_ROUNDNESS } from '@ValenceMobile/components/AFace/FACE_ROUNDNESS';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const SIDE = 96;

const LARGE_SIDE = 136;

const SMALL_SIDE = 60;

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 8 },
  initial: { fontSize: 38 },
  largeInitial: { fontSize: 54 },
  smallInitial: { fontSize: 24 },
  picture: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

/**
 * Where a photograph is drawn in its tile so the tile shows the part its frame chose, once the
 * photograph's size is known; until then, or where there is no frame to follow, it fills the tile
 * from its middle.
 *
 * @param frame - Where it sits, or nothing to fill the tile.
 * @param size - How large the photograph is, once it has loaded.
 * @param side - How wide the tile is.
 * @returns How to place it.
 */
const placedIn = (
  frame: PhotoFrame | null,
  size: { width: number; height: number } | null,
  side: number,
): ViewStyle => {
  if (frame === null || size === null) {
    return styles.picture;
  }

  const at = placedPicture(size, PICTURE_ASPECTS.face, frame);

  return {
    left: at.left * side,
    top: at.top * side,
    width: at.width * side,
    height: at.height * side,
    position: 'absolute',
  };
};

const AFace = ({
  profile,
  picked = null,
  isLarge = false,
  isSmall = false,
  tileMotion,
}: AFaceProps) => {
  const colours = useTheColours();
  const [told, setTold] = useState<{ uri: string; seen: 'here' | 'missing' } | null>(null);
  const [measured, setMeasured] = useState<{
    uri: string;
    size: { width: number; height: number };
  } | null>(null);
  const found = thePictureFor(profile, picked);
  const seen =
    found === null ? undefined : told?.uri === found.uri ? told.seen : PICTURES_SEEN.get(found.uri);
  const picture = found === null || seen === 'missing' ? null : found;
  const isShowing = picture !== null && seen === 'here';

  /**
   * Remembers what became of a picture, here and for every face drawn after, so one that could not
   * be read is not asked for again each time a screen of faces is drawn.
   *
   * @param uri - The picture.
   * @param now - Whether it was read or could not be.
   */
  const tell = (uri: string, now: 'here' | 'missing') => {
    PICTURES_SEEN.set(uri, now);
    setTold((was) => (was?.uri === uri && was.seen === now ? was : { uri, seen: now }));
  };
  const side = isLarge ? LARGE_SIDE : isSmall ? SMALL_SIDE : SIDE;

  return (
    <View style={[styles.face, { width: side }]}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: backdropOfAFace(profile.colour, isShowing, colours.text),
            borderCurve: 'continuous',
            borderRadius: Math.round(side * FACE_ROUNDNESS),
            height: side,
            width: side,
          },
          tileMotion,
        ]}
      >
        {profile.avatar.kind === 'photo' && profile.avatar.isVideo && picked === null ? (
          <View style={styles.picture}>
            <AMovingFace uri={onThisServer(profileAvatarUrl(profile))} />
          </View>
        ) : null}

        {isShowing ? null : (
          <Text
            style={[
              styles.initial,
              isLarge && styles.largeInitial,
              isSmall && styles.smallInitial,
              {
                color: LETTER_INKS[inkFor(profile.colour)],
                fontFamily:
                  LETTER_FACES[
                    profile.avatar.kind === 'initial'
                      ? profile.avatar.font
                      : PLUS_JAKARTA_SANS_AS_STORED
                  ],
              },
            ]}
          >
            {profileInitial(profile.name)}
          </Text>
        )}

        {picture === null ? null : (
          <View
            style={[
              placedIn(
                profile.avatar.kind !== 'photo' ||
                  (picked === null && profile.avatar.hasFramedPicture)
                  ? null
                  : profile.avatar.frame,
                measured?.uri === picture.uri ? measured.size : null,
                side,
              ),
            ]}
          >
            <APicture
              picture={picture}
              onLoad={(size) => {
                tell(picture.uri, 'here');

                if (size !== undefined && size.width > 0 && size.height > 0) {
                  setMeasured({ uri: picture.uri, size });
                }
              }}
              onMissing={() => {
                tell(picture.uri, 'missing');
              }}
            />
          </View>
        )}
      </Animated.View>

      {isLarge || isSmall ? null : (
        <Words tone="muted" lines={1}>
          {profile.name}
        </Words>
      )}
    </View>
  );
};

AFace.displayName = 'AFace';

export { AFace };
