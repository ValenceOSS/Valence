import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { tomatoMarkOf } from '@ValenceNative/library/tomatoMarkOf';
import type { TomatoMarkProps } from './TomatoMark.types';

const SIZE = 30;

/**
 * The mark Rotten Tomatoes shows beside a critics' score, as the web shows it beside the score in a
 * title's details: the fresh tomato from 60% up, and the green splat below that.
 *
 * @param score - The critics' score, as a percentage.
 */
const TomatoMark = ({ score }: TomatoMarkProps) => {
  const mark = tomatoMarkOf(score);

  return (
    <Image
      source={mark.picture}
      style={styles.mark}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={mark.label}
    />
  );
};

TomatoMark.displayName = 'TomatoMark';

const styles = StyleSheet.create({
  mark: { width: SIZE, height: SIZE },
});

export { TomatoMark };
