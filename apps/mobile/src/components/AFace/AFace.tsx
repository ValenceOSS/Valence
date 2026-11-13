import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { profileAvatarUrl, profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { PICTURES_SEEN } from '@ValenceMobile/components/AFace/PICTURES_SEEN';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { useSettledValue } from '@ValenceClient/profiles/useSettledValue';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { AMovingFace } from '@ValenceMobile/components/AMovingFace/AMovingFace';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { Words } from '@ValenceMobile/components/Words/Words';
import { facePaint } from '@ValenceClient/profiles/facePaint';
import { paintStyleOf } from '@ValenceMobile/pictures/paintStyleOf';
import { LETTER_INKS } from '@ValenceNative/library/LETTER_INKS';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import type { ViewStyle } from 'react-native';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';
import { toneOfFilter } from '@ValenceContracts/functions/toneOfFilter';
import { ATonedPicture } from '@ValenceMobile/components/ATonedPicture/ATonedPicture';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import type { AFaceProps } from './AFace.types';
import { backdropOfAFace } from '@ValenceMobile/components/AFace/backdropOfAFace';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { FACE_ROUNDNESS } from '@ValenceMobile/components/AFace/FACE_ROUNDNESS';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const SIDE = 96;

const LARGE_SIDE = 136;

const SMALL_SIDE = 60;

const LETTER_SHARE = 0.4;

const SETTLES_AFTER = 250;

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
 * The initial is drawn in the letter the profile chose, on its colour or its gradient, in dark or
 * light ink by whichever reads there rather than by the theme, as the web draws it. A drawn face on
 * a colour is read clear with the colour painted behind it, so a colour being chosen shows at once.
 * A photograph sits in its tile the way its owner framed it.
 *
 * @param profile - Whose face to draw.
 * @param picked - A photograph chosen on this phone and not yet sent, to show in its place.
 * @param isLarge - Whether it is the one face on the screen, drawn larger and without its name, for a
 *   screen that names them itself.
 * @param isSmall - Whether it is an avatar beside somebody's name, drawn small and without the name.
 * @param side - How wide to draw it, where neither of those sizes fits, without its name.
 * @param tileMotion - A movement for the picture alone, leaving its name where it is, for a face
 *   flying into its place.
 */
const AFace = ({
  profile,
  picked = null,
  isLarge = false,
  isSmall = false,
  side: sideAsked,
  tileMotion,
}: AFaceProps) => {
  const colours = useTheColours();
  const [told, setTold] = useState<{ uri: string; seen: 'here' | 'missing' } | null>(null);
  const [measured, setMeasured] = useState<{
    uri: string;
    size: { width: number; height: number };
  } | null>(null);
  const { avatar } = profile;
  const isOnColour = avatar.kind === 'drawn' && avatar.isOnColour === true;
  const settledColour = useSettledValue(profile.colour, SETTLES_AFTER);
  const ink = facePaint(profile.colour, avatar.kind === 'initial' ? avatar.colourTo : null).ink;
  const found =
    picked === null && avatar.kind === 'drawn'
      ? {
          uri: onThisServer(
            drawingToShow(avatar.style, avatar.seed, isOnColour ? settledColour : null),
          ),
          isDrawn: true,
        }
      : thePictureFor(profile, picked);
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

  /**
   * Notes that a picture arrived, and how large it is where that is known, so it can be placed in
   * its frame.
   *
   * @param uri - The picture.
   * @param size - How large it is, where that was told.
   */
  const loaded = (uri: string, size: { width: number; height: number } | undefined) => {
    tell(uri, 'here');

    if (size !== undefined && size.width > 0 && size.height > 0) {
      setMeasured({ uri, size });
    }
  };
  const side = sideAsked ?? (isLarge ? LARGE_SIDE : isSmall ? SMALL_SIDE : SIDE);
  const localTone =
    profile.avatar.kind === 'photo' && (picked !== null || !profile.avatar.hasFramedPicture)
      ? toneOfFilter(profile.avatar.filter)
      : null;

  return (
    <View style={[styles.face, { width: side }]}>
      <Animated.View
        style={[
          styles.tile,
          isShowing
            ? {
                backgroundColor: isOnColour
                  ? profile.colour
                  : backdropOfAFace(profile.colour, true, colours.text),
              }
            : paintStyleOf(profile.colour, avatar.kind === 'initial' ? avatar.colourTo : null),
          {
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
              sideAsked === undefined ? null : { fontSize: Math.round(sideAsked * LETTER_SHARE) },
              {
                color: LETTER_INKS[ink],
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
          <View style={styles.picture}>
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
              {localTone === null ? (
                <APicture
                  picture={picture}
                  onLoad={(size) => {
                    loaded(picture.uri, size);
                  }}
                  onMissing={() => {
                    tell(picture.uri, 'missing');
                  }}
                />
              ) : (
                <ATonedPicture
                  uri={picture.uri}
                  tone={localTone}
                  style={styles.picture}
                  onLoad={(size) => {
                    loaded(picture.uri, size);
                  }}
                  onMissing={() => {
                    tell(picture.uri, 'missing');
                  }}
                />
              )}
            </View>
          </View>
        )}
      </Animated.View>

      {isLarge || isSmall || sideAsked !== undefined ? null : (
        <Words tone="muted" lines={1}>
          {profile.name}
        </Words>
      )}
    </View>
  );
};

AFace.displayName = 'AFace';

export { AFace };
