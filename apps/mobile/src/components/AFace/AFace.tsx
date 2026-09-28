import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { PICTURES_SEEN } from '@ValenceMobile/components/AFace/PICTURES_SEEN';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { Words } from '@ValenceMobile/components/Words/Words';
import { inkFor } from '@ValenceClient/library/inkFor';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import type { ViewStyle } from 'react-native';
import type { Avatar } from '@ValenceContracts/schemas/ViewerProfile';
import type { AFaceProps } from './AFace.types';

const SIDE = 96;

const LARGE_SIDE = 136;

const ROUNDNESS = 0.06;

const INK = { dark: '#15171a', light: '#f7f7f5' } as const;

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 8 },
  initial: { fontSize: 38 },
  largeInitial: { fontSize: 54 },
  picture: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

/**
 * How a framed photograph sits in its tile, as the web frames it: grown by its zoom and slid by its
 * position, where a position of one moves it as far as the zoom leaves room to.
 *
 * @param avatar - The face, which only a photograph with a frame is moved for.
 * @param side - How wide the tile is.
 * @returns The movement to draw the picture with, or nothing.
 */
const framed = (avatar: Avatar | null, side: number): ViewStyle | null => {
  if (avatar?.kind !== 'photo' || avatar.frame === null) {
    return null;
  }

  const { zoom, x, y } = avatar.frame;
  const room = ((zoom - 1) / (2 * zoom)) * side;

  return { transform: [{ scale: zoom }, { translateX: -x * room }, { translateY: -y * room }] };
};

/**
 * Draws what somebody looks like on the way in — their picture where they have one, and the first
 * letter of their name where they have not.
 *
 * A picture the server cannot produce falls back to the initial, the same way the browser client
 * does and for the same reason: a face says it has one whenever a filename is stored against it,
 * and the file behind that name can be gone. Until a picture has been read the tile shows its
 * colour and initial rather than nothing, and what became of each picture is remembered while the
 * app is open, so a wall drawn again neither waits on one it has shown nor asks again for one that
 * was not there.
 *
 * The initial is drawn in the letter the profile chose, in dark or light ink by whichever reads on
 * the colour it sits on rather than by the theme, since that colour is the same in both themes, as
 * the web draws it. A photograph sits in its tile the way its owner framed it.
 *
 * @param profile - Whose face to draw.
 * @param picked - A photograph chosen on this phone and not yet sent, to show in its place.
 * @param isLarge - Whether it is the one face on the screen, drawn larger and without its name, for a
 *   screen that names them itself.
 * @param tileMotion - A movement for the picture alone, leaving its name where it is, for a face
 *   flying into its place.
 */
const AFace = ({ profile, picked = null, isLarge = false, tileMotion }: AFaceProps) => {
  const [told, setTold] = useState<{ uri: string; seen: 'here' | 'missing' } | null>(null);
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
  const side = isLarge ? LARGE_SIDE : SIDE;

  return (
    <View style={[styles.face, { width: side }]}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: isShowing && !picture.isDrawn ? 'transparent' : profile.colour,
            borderRadius: Math.round(side * ROUNDNESS),
            height: side,
            width: side,
          },
          tileMotion,
        ]}
      >
        {isShowing ? null : (
          <Text
            style={[
              styles.initial,
              isLarge && styles.largeInitial,
              {
                color: INK[inkFor(profile.colour)],
                fontFamily:
                  LETTER_FACES[profile.avatar.kind === 'initial' ? profile.avatar.font : 'gilroy'],
              },
            ]}
          >
            {profileInitial(profile.name)}
          </Text>
        )}

        {picture === null ? null : (
          <View style={[styles.picture, framed(picked === null ? profile.avatar : null, side)]}>
            <APicture
              picture={picture}
              onLoad={() => {
                tell(picture.uri, 'here');
              }}
              onMissing={() => {
                tell(picture.uri, 'missing');
              }}
            />
          </View>
        )}
      </Animated.View>

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
