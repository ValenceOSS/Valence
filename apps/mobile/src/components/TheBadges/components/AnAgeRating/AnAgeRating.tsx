import { Image, StyleSheet, View } from 'react-native';
import { ageRatingOf } from '@ValenceCore/functions/ageRatingOf';
import { Words } from '@ValenceMobile/components/Words/Words';
import { RATING_PICTURES } from './RATING_PICTURES';
import type { AnAgeRatingProps } from './AnAgeRating.types';

const HEIGHT = 20;

const styles = StyleSheet.create({
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
 */
const AnAgeRating = ({ certification, region, ink, isOnArtwork = false }: AnAgeRatingProps) => {
  const rating = ageRatingOf(region, certification);

  if (rating.picture === null) {
    return (
      <View
        style={[styles.outline, { borderColor: ink }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={rating.label}
      >
        <Words size="small" tone={isOnArtwork ? 'onArtwork' : 'muted'} isStrong>
          {rating.said}
        </Words>
      </View>
    );
  }

  const source = RATING_PICTURES[rating.picture];
  const size = Image.resolveAssetSource(source);
  const tall = size?.height ?? 0;
  const width = tall > 0 ? (HEIGHT * (size?.width ?? tall)) / tall : HEIGHT;

  return (
    <Image
      source={source}
      style={[styles.picture, { width }]}
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
