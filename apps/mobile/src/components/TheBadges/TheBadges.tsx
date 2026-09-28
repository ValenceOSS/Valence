import { StyleSheet, View } from 'react-native';
import { shortenedForAPhone } from '@ValenceMobile/components/TheBadges/shortenedForAPhone';
import { AnAgeRating } from '@ValenceMobile/components/TheBadges/components/AnAgeRating/AnAgeRating';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheBadgesProps } from './TheBadges.types';

const ON_ARTWORK = 'rgba(255,255,255,0.7)';

const styles = StyleSheet.create({
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

/**
 * What something is certified as and how it looks and sounds: its certificate as its board publishes it, then outlined badges: 4K, Dolby Vision, Atmos, 5.1.
 *
 * @param badges - What to say.
 * @param isOnArtwork - Whether they sit on a picture, and so are drawn in white.
 * @param isShort - Whether room is tight, and Dolby's formats go by their short names.
 * @param rating - Its certificate and the country whose board issued it, where it has one.
 */
const TheBadges = ({
  badges,
  isOnArtwork = false,
  isShort = false,
  rating = null,
}: TheBadgesProps) => {
  const colours = useTheColours();

  if (badges.length === 0 && rating === null) {
    return null;
  }

  return (
    <View style={styles.row}>
      {rating === null ? null : (
        <AnAgeRating
          certification={rating.certification}
          region={rating.region}
          ink={isOnArtwork ? ON_ARTWORK : colours.textMuted}
          isOnArtwork={isOnArtwork}
        />
      )}

      {badges.map((badge) => (
        <View
          key={badge}
          style={[styles.badge, { borderColor: isOnArtwork ? ON_ARTWORK : colours.textMuted }]}
        >
          <Words size="small" tone={isOnArtwork ? 'onArtwork' : 'muted'} isStrong>
            {isShort ? shortenedForAPhone(badge) : badge}
          </Words>
        </View>
      ))}
    </View>
  );
};

TheBadges.displayName = 'TheBadges';

export { TheBadges };
