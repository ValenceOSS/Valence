import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { FONTS } from '@ValencePhone/theme/FONTS';
import type { TheSkipProps } from './TheSkip.types';

const OVER_THE_PICTURE = '#ffffff';

const BEHIND_IT = 'rgba(20, 20, 20, 0.82)';

const EDGE = 24;

const styles = StyleSheet.create({
  said: { color: OVER_THE_PICTURE, fontSize: 14, fontFamily: FONTS.sans.semibold },
  sitting: {
    backgroundColor: BEHIND_IT,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  whole: { bottom: 0, position: 'absolute', right: 0 },
});

/**
 * The offer to skip past a stretch of a film nobody watches twice.
 *
 * Sits low and to the side rather than over the picture, and only while the thing it skips is
 * playing: an offer that outlives what it offers is a button somebody presses by accident, and one
 * that appears before it is a button nobody understands.
 *
 * It is drawn whether the controls are up or not, because it is the one thing here somebody is
 * waiting for rather than looking for.
 *
 * @param says - What it offers, which depends on what was marked.
 * @param onSkip - Told to go past it.
 */
const TheSkip = ({ says, onSkip }: TheSkipProps) => {
  const room = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.whole,
        { paddingBottom: room.bottom + 84, paddingRight: Math.max(room.right, EDGE) },
      ]}
    >
      <Button tone="bare" label={says} onPress={onSkip}>
        <View style={styles.sitting}>
          <Text style={styles.said}>{says}</Text>
        </View>
      </Button>
    </View>
  );
};

TheSkip.displayName = 'TheSkip';

export { TheSkip };
