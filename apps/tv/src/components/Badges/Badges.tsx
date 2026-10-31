import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { AgeRating } from '@ValenceTv/components/AgeRating/AgeRating';
import type { BadgesProps } from './Badges.types';

/**
 * The small marks beside a title's year that say who it is for and how it looks and sounds — its
 * certificate as its board publishes it, then 4K, Dolby Vision, 5.1 — as the television's streaming
 * apps set them: outlined over a playing film, and solid on a title's own page, as the phone's are.
 *
 * @param badges - What to mark.
 * @param rating - Its certificate and the country whose board issued it, where it has one.
 * @param isSolid - Whether they are filled solid rather than outlined.
 */
const Badges = ({ badges, rating = null, isSolid = false }: BadgesProps) => (
  <>
    {rating === null ? null : (
      <AgeRating
        key={`${rating.region}:${rating.certification}`}
        certification={rating.certification}
        region={rating.region}
      />
    )}
    {badges.map((badge) => (
      <View key={badge} style={[styles.badge, isSolid && styles.solid]}>
        <Text style={[styles.text, isSolid && styles.solidText]}>{badge}</Text>
      </View>
    ))}
  </>
);

Badges.displayName = 'Badges';

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    borderColor: withAlpha(tokens.colours.text, 0.7),
    borderRadius: tokens.radii.xs,
    paddingHorizontal: tokens.space.xs,
  },
  text: { color: tokens.colours.text, fontSize: tokens.type.small - 4, fontWeight: '700' },
  solid: { backgroundColor: tokens.colours.text, borderColor: tokens.colours.text },
  solidText: { color: tokens.colours.canvas },
});

export { Badges };
