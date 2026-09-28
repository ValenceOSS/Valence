import { Shuffle } from '@keyline-icons/react-native';
import { Sparkle as SparkleFilled } from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AShuffleMarkProps } from './AShuffleMark.types';

const ROOM = 18;

const DOT = 4;

const styles = StyleSheet.create({
  dot: { borderRadius: DOT / 2, bottom: 2, height: DOT, position: 'absolute', width: DOT },
  sparkle: { position: 'absolute', right: 1, top: 1 },
  whole: { alignItems: 'center', justifyContent: 'center' },
});

/**
 * The shuffle button's icon in each of its three settings: muted when off, in the accent colour
 * with a dot beneath it when shuffling, and with a sparkle at its corner as well when smart shuffle
 * is mixing songs from the library in.
 *
 * @param mode - Which setting shuffle is on.
 * @param size - How big the icon is; room is left around it for the dot and the sparkle.
 */
const AShuffleMark = ({ mode, size }: AShuffleMarkProps) => {
  const colours = useTheColours();
  const across = size + ROOM;
  const ink = mode === 'off' ? colours.textMuted : colours.accent;

  return (
    <View style={[styles.whole, { height: across, width: across }]}>
      <Icon of={Shuffle} size={size} colour={ink} />
      {mode === 'smart' ? (
        <View style={styles.sparkle}>
          <Icon of={SparkleFilled} size={Math.round(size / 2)} colour={ink} />
        </View>
      ) : null}
      {mode === 'off' ? null : <View style={[styles.dot, { backgroundColor: ink }]} />}
    </View>
  );
};

AShuffleMark.displayName = 'AShuffleMark';

export { AShuffleMark };
