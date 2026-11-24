import { Image, StyleSheet } from 'react-native';
import { tomatoMarkOf } from '@ValenceNative/library/tomatoMarkOf';
import type { ATomatoMarkProps } from './ATomatoMark.types';

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
  const mark = tomatoMarkOf(score);

  return (
    <Image
      source={mark.picture}
      style={styles.mark}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={mark.label}
      accessibilityIgnoresInvertColors
    />
  );
};

ATomatoMark.displayName = 'ATomatoMark';

export { ATomatoMark };
