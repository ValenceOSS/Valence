import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { FONTS } from '@ValencePhone/theme/FONTS';
import type { TheNoticeProps } from './TheNotice.types';

const OVER_THE_PICTURE = '#ffffff';

const BEHIND_IT = 'rgba(20, 20, 20, 0.88)';

const styles = StyleSheet.create({
  dismiss: {
    color: OVER_THE_PICTURE,
    fontSize: 14,
    fontFamily: FONTS.sans.semibold,
    opacity: 0.75,
  },
  place: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  said: { color: OVER_THE_PICTURE, flexShrink: 1, fontFamily: FONTS.sans.regular, fontSize: 15 },
  sitting: {
    alignItems: 'center',
    backgroundColor: BEHIND_IT,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    maxWidth: 560,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});

/**
 * Something whoever runs the server has said to this viewer, held over the picture until they
 * dismiss it — why the film paused, or a message of their own.
 *
 * @param says - What was said.
 * @param onDismiss - Told it has been read.
 */
const TheNotice = ({ says, onDismiss }: TheNoticeProps) => {
  const room = useSafeAreaInsets();

  return (
    <View style={[styles.place, { top: Math.max(room.top, 16) + 8 }]} pointerEvents="box-none">
      <View style={styles.sitting}>
        <Text style={styles.said}>{says}</Text>
        <Button tone="bare" label="Dismiss" onPress={onDismiss}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Button>
      </View>
    </View>
  );
};

TheNotice.displayName = 'TheNotice';

export { TheNotice };
