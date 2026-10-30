import { Image, StyleSheet, View } from 'react-native';
import { ageRatingOf } from '@ValenceCore/functions/ageRatingOf';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { RATING_PICTURES } from '@ValenceNative/library/RATING_PICTURES';
import type { AnAgeRatingProps } from './AnAgeRating.types';

const HEIGHT = 20;

const LARGE_HEIGHT = 28;

const styles = StyleSheet.create({
  large: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 2 },
  outline: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  picture: { height: HEIGHT },
});

/**
 * A title's certificate as the board that issued it publishes it, as the web shows it, and written
 * out in an outline where there is no mark for it.
 *
 * @param certification - The certificate, such as 15 or PG-13.
 * @param region - The two-letter country whose board issued it.
 * @param ink - The colour of the words around it, for a certificate written out.
 * @param isOnArtwork - Whether it sits on a picture, and so is written in white.
 * @param isLarge - Whether it is drawn larger, as it is on a card about one title.
 * @param isSolid - Whether, where it is written out, it is filled solid rather than outlined, as it
 *   always is when large.
 */
const AnAgeRating = ({
  certification,
  region,
  ink,
  isOnArtwork = false,
  isLarge = false,
  isSolid = isLarge,
}: AnAgeRatingProps) => {
  const colours = useTheColours();
  const rating = ageRatingOf(region, certification);
  const high = isLarge ? LARGE_HEIGHT : HEIGHT;

  if (rating.picture === null) {
    return (
      <View
        style={[
          styles.outline,
          isLarge && styles.large,
          { borderColor: ink },
          isSolid && { backgroundColor: ink, borderColor: ink },
        ]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={rating.label}
      >
        <Words
          size={isLarge ? 'body' : 'small'}
          tone={isOnArtwork ? 'onArtwork' : 'muted'}
          isStrong
          {...(isSolid ? { colour: colours.surface } : {})}
        >
          {rating.said}
        </Words>
      </View>
    );
  }

  const source = RATING_PICTURES[rating.picture];
  const size = Image.resolveAssetSource(source);
  const tall = size?.height ?? 0;
  const width = tall > 0 ? (high * (size?.width ?? tall)) / tall : high;

  return (
    <Image
      source={source}
      style={[styles.picture, { height: high, width }]}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={rating.label}
      accessibilityIgnoresInvertColors
    />
  );
};

AnAgeRating.displayName = 'AnAgeRating';

export { AnAgeRating };
