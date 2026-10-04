import { Image, StyleSheet } from 'react-native';
import fresh from '@ValenceRatings/rotten-tomatoes-fresh.png';
import rotten from '@ValenceRatings/rotten-tomatoes-rotten.png';
import { isFreshTomato } from '@ValenceCore/functions/isFreshTomato';
import type { ATomatoMarkProps } from './ATomatoMark.types';
import { say } from '@ValenceI18n/say';

const SIZE = 16;

const styles = StyleSheet.create({
  mark: { height: SIZE, width: SIZE },
});

/**
 * The mark Rotten Tomatoes shows beside a critics' score, as the web shows it: the fresh tomato from
 * 60% up, and the green splat below that.
 *
 * @param score - The critics' score, as a percentage.
 */
const ATomatoMark = ({ score }: ATomatoMarkProps) => {
  const isFresh = isFreshTomato(score);

  return (
    <Image
      source={isFresh ? fresh : rotten}
      style={styles.mark}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        isFresh
          ? say('ui.tomatoMark.freshOnRottenTomatoes')
          : say('ui.tomatoMark.rottenOnRottenTomatoes')
      }
      accessibilityIgnoresInvertColors
    />
  );
};

ATomatoMark.displayName = 'ATomatoMark';

export { ATomatoMark };
