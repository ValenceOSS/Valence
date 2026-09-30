import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { STILL_WIDTH } from '@ValenceMobile/components/APoster/STILL_WIDTH';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AnArtCardProps } from './AnArtCard.types';
import { say } from '@ValenceI18n/say';

const RATIO = 9 / 16;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  flag: {
    alignSelf: 'center',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    position: 'absolute',
  },
  flagWords: { fontSize: 11, fontWeight: '700' },
  howFar: { alignSelf: 'center', width: '60%' },
  logo: { bottom: '14%', height: '38%', left: '6%', position: 'absolute', width: '55%' },
  name: {
    bottom: '14%',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    left: '6%',
    position: 'absolute',
    right: '6%',
    textShadowColor: withAlpha('#000000', 0.6),
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 6,
  },
  picture: { height: '100%', width: '100%' },
  standIn: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  tile: { borderRadius: 12, overflow: 'hidden' },
  whole: { gap: 8 },
});

/**
 * A title as a picture alone, as a streaming service's home page lays one out: its backdrop, lying
 * flat, with its own logo drawn into the corner rather than its name written beneath. Where there is
 * no logo, or it cannot be read, the name is written into the picture in its place.
 *
 * A flag along the foot of the picture says what is new about it, and a short line beneath says how
 * far through it somebody is, both in the theme's own accent.
 *
 * @param title - What it is called, which stands in for a missing logo.
 * @param artwork - Its backdrop, or nothing where it has none.
 * @param logo - Its logo, or nothing where it has none.
 * @param flag - What is new about it, where anything is.
 * @param watched - How much of it has been seen, as a fraction.
 * @param wide - How wide to draw it.
 */
const AnArtCard = ({
  title,
  artwork,
  logo,
  flag = null,
  watched = 0,
  wide = STILL_WIDTH,
}: AnArtCardProps) => {
  const colours = useTheColours();
  const [isPictureMissing, setIsPictureMissing] = useState(false);
  const [isLogoMissing, setIsLogoMissing] = useState(false);
  const size = { height: wide * RATIO, width: wide };
  const hasPicture = artwork !== null && !isPictureMissing;

  return (
    <View style={[styles.whole, { width: wide }]}>
      <View style={[styles.tile, size, { backgroundColor: colours.surfaceRaised }]}>
        {hasPicture ? (
          <Image
            style={styles.picture}
            source={{ uri: artwork }}
            onError={() => {
              setIsPictureMissing(true);
            }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.fills, styles.standIn]}>
            <Words size="small" tone="muted" lines={2}>
              {title}
            </Words>
          </View>
        )}

        {hasPicture ? (
          <View
            style={[styles.fills, { backgroundColor: withAlpha('#000000', 0.18) }]}
            pointerEvents="none"
          />
        ) : null}

        {hasPicture && logo !== null && !isLogoMissing ? (
          <Image
            style={styles.logo}
            source={{ uri: logo }}
            resizeMode="contain"
            onError={() => {
              setIsLogoMissing(true);
            }}
            accessibilityIgnoresInvertColors
          />
        ) : hasPicture ? (
          <Text style={styles.name} numberOfLines={2}>
            {title}
          </Text>
        ) : null}

        {flag === null ? null : (
          <View style={[styles.flag, { backgroundColor: colours.accent }]}>
            <Text style={[styles.flagWords, { color: colours.accentContrast }]}>{flag}</Text>
          </View>
        )}
      </View>

      {watched > 0 && watched < 1 ? (
        <View style={styles.howFar}>
          <HowFar fraction={watched} label={say('common.howFarThroughTitle', { title })} />
        </View>
      ) : null}
    </View>
  );
};

AnArtCard.displayName = 'AnArtCard';

export { AnArtCard };
