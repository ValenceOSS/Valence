import { StyleSheet, View } from 'react-native';
import { shortenedForAPhone } from '@ValenceMobile/components/TheBadges/shortenedForAPhone';
import { AnAgeRating } from '@ValenceMobile/components/TheBadges/components/AnAgeRating/AnAgeRating';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheBadgesProps } from './TheBadges.types';

const ON_ARTWORK = 'rgba(255,255,255,0.7)';

const styles = StyleSheet.create({
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  large: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 2 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowLarge: { gap: 8 },
});

/**
 * What something is certified as and how it looks and sounds: its certificate as its board publishes it, then outlined badges: 4K, Dolby Vision, Atmos, 5.1.
 *
 * @param badges - What to say.
 * @param isOnArtwork - Whether they sit on a picture, and so are drawn in white.
 * @param isShort - Whether room is tight, and Dolby's formats go by their short names.
 * @param isLarge - Whether they are drawn larger, as they are on a card about one title.
 * @param isSolid - Whether they are filled solid in the page's ink rather than outlined, as they
 *   always are when large.
 * @param rating - Its certificate and the country whose board issued it, where it has one.
 */
const TheBadges = ({
  badges,
  isOnArtwork = false,
  isShort = false,
  isLarge = false,
  isSolid = isLarge,
  rating = null,
}: TheBadgesProps) => {
  const colours = useTheColours();

  if (badges.length === 0 && rating === null) {
    return null;
  }

  return (
    <View style={[styles.row, isLarge && styles.rowLarge]}>
      {rating === null ? null : (
        <AnAgeRating
          certification={rating.certification}
          region={rating.region}
          ink={isOnArtwork ? ON_ARTWORK : colours.textMuted}
          isOnArtwork={isOnArtwork}
          isLarge={isLarge}
          isSolid={isSolid}
        />
      )}

      {badges.map((badge) => (
        <View
          key={badge}
          style={[
            styles.badge,
            isLarge && styles.large,
            { borderColor: isOnArtwork ? ON_ARTWORK : colours.textMuted },
            isSolid && { backgroundColor: colours.text, borderColor: colours.text },
          ]}
        >
          <Words
            size={isLarge ? 'body' : 'small'}
            tone={isOnArtwork ? 'onArtwork' : 'muted'}
            isStrong
            {...(isSolid ? { colour: colours.surface } : {})}
          >
            {isShort ? shortenedForAPhone(badge) : badge}
          </Words>
        </View>
      ))}
    </View>
  );
};

TheBadges.displayName = 'TheBadges';

export { TheBadges };
