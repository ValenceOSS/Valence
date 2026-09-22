import { StyleSheet, View } from 'react-native';
import { shortenedForAPhone } from '@ValencePhone/components/TheBadges/shortenedForAPhone';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheBadgesProps } from './TheBadges.types';

const ON_ARTWORK = 'rgba(255,255,255,0.7)';

const styles = StyleSheet.create({
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

/**
 * How something looks and sounds, as outlined badges — 4K, Dolby Vision, Atmos, 5.1.
 *
 * @param badges - What to say.
 * @param isOnArtwork - Whether they sit on a picture, and so are drawn in white.
 * @param isShort - Whether room is tight, and Dolby's formats go by their short names.
 */
const TheBadges = ({ badges, isOnArtwork = false, isShort = false }: TheBadgesProps) => {
  const colours = useTheColours();

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {badges.map((badge) => (
        <View
          key={badge}
          style={[styles.badge, { borderColor: isOnArtwork ? ON_ARTWORK : colours.textMuted }]}
        >
          <Words size="small" tone={isOnArtwork ? 'onArtwork' : 'muted'}>
            {isShort ? shortenedForAPhone(badge) : badge}
          </Words>
        </View>
      ))}
    </View>
  );
};

TheBadges.displayName = 'TheBadges';

export { TheBadges };
