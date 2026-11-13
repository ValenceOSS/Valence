import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { profileAvatarUrl, profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { PICTURES_SEEN } from '@ValenceMobile/components/AFace/PICTURES_SEEN';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { AMovingFace } from '@ValenceMobile/components/AMovingFace/AMovingFace';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { Words } from '@ValenceMobile/components/Words/Words';
import { facePaint } from '@ValenceClient/profiles/facePaint';
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
  const paint = facePaint(profile.colour, avatar.kind === 'initial' ? avatar.colourTo : null);
  const found =
    picked === null && avatar.kind === 'drawn'
      ? {
          uri: onThisServer(
            drawingToShow(avatar.style, avatar.seed, isOnColour ? profile.colour : null),
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
          {
            backgroundColor: isOnColour
              ? profile.colour
              : backdropOfAFace(
                  paint.style.backgroundColor ?? profile.colour,
                  isShowing,
                  colours.text,
                ),
            ...(isShowing || paint.style.backgroundImage === undefined
              ? {}
              : { experimental_backgroundImage: paint.style.backgroundImage }),
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
                color: LETTER_INKS[paint.ink],
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
