import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ageRatingOf } from '@ValenceCore/functions/ageRatingOf';
import { RATING_PICTURES } from '@ValenceNative/library/RATING_PICTURES';
import { tokens } from '@ValenceTv/theme/tokens';
import type { AgeRatingProps } from './AgeRating.types';

const HIGH = 40;

/**
 * A title's certificate as the board that issued it publishes it — the BBFC's 12A, the MPA's PG-13
 * — as the phone and the web show it, as wide as its mark is, and written out on a solid badge
 * where there is no mark for it.
 *
 * @param certification - The certificate, such as 15 or PG-13.
 * @param region - The two-letter country whose board issued it.
 */
const AgeRating = ({ certification, region }: AgeRatingProps) => {
  const rating = ageRatingOf(region, certification);
  const [wide, setWide] = useState(HIGH);

  if (rating.picture === null) {
    return (
      <View
        style={styles.written}
        accessible
        accessibilityRole="image"
        accessibilityLabel={rating.label}
      >
        <Text style={styles.said}>{rating.said}</Text>
      </View>
    );
  }

  return (
    <Image
      source={RATING_PICTURES[rating.picture]}
      style={{ height: HIGH, width: wide }}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={rating.label}
      onLoad={(event) => {
        if (event.source.height > 0) {
          setWide((HIGH * event.source.width) / event.source.height);
        }
      }}
    />
  );
};

AgeRating.displayName = 'AgeRating';

const styles = StyleSheet.create({
  written: {
    backgroundColor: tokens.colours.text,
    borderRadius: tokens.radii.xs,
    paddingHorizontal: tokens.space.xs,
    paddingVertical: 2,
  },
  said: { color: tokens.colours.canvas, fontSize: tokens.type.small - 4, fontWeight: '800' },
});

export { AgeRating };
