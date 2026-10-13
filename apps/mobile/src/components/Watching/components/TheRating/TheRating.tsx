import { Heart, ThumbsDown, ThumbsUp } from '@keyline-icons/react-native';
import {
  Heart as HeartFilled,
  ThumbsDown as ThumbsDownFilled,
  ThumbsUp as ThumbsUpFilled,
} from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { TheRatingProps } from './TheRating.types';
import { say } from '@ValenceI18n/say';

const CHOICES = [
  { stars: 1, label: say('phone.watching.notForMe'), icon: ThumbsDown, chosen: ThumbsDownFilled },
  { stars: 4, label: say('phone.watching.iLikeThis'), icon: ThumbsUp, chosen: ThumbsUpFilled },
  { stars: 5, label: say('phone.watching.loveThis'), icon: Heart, chosen: HeartFilled },
] as const;

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: PLAYER_LOOK.colours.chip,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  chosen: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  row: { flexDirection: 'row', gap: 14 },
});

/**
 * Whether it is for them, said in a tap while watching rather than afterwards on the title's page:
 * not for me, I like this, and love this. Each is a number of stars underneath — one, four and five
 * — so it is the same rating the stars on the title's page show. Pressing the one already given
 * takes it back.
 *
 * @param given - The stars they gave, or none.
 * @param onRate - Told the stars to give, or none to take the rating back.
 */
const TheRating = ({ given, onRate }: TheRatingProps) => {
  const shown = given === null ? null : given <= 2 ? 1 : given <= 4 ? 4 : 5;

  return (
    <View style={styles.row}>
      {CHOICES.map((choice) => (
        <Button
          key={choice.stars}
          tone="bare"
          isChosen={shown === choice.stars}
          label={choice.label}
          onPress={() => {
            onRate(shown === choice.stars ? null : choice.stars);
          }}
        >
          <View style={[styles.circle, shown === choice.stars && styles.chosen]}>
            <Icon
              of={shown === choice.stars ? choice.chosen : choice.icon}
              size={24}
              colour={PLAYER_LOOK.colours.text}
            />
          </View>
        </Button>
      ))}
    </View>
  );
};

TheRating.displayName = 'TheRating';

export { TheRating };
