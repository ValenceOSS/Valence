import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { GapDotsProps } from './GapDots.types';

const DOTS = 3;

const DOT = 22;

/**
 * Three dots standing in for a stretch with no words, each filling in turn as the gap passes, so
 * a long instrumental says the words will come back and roughly when.
 *
 * @param through - How far through the gap the song is, from nought to one.
 */
const GapDotsRow = ({ through }: GapDotsProps) => (
  <View style={styles.row}>
    {Array.from({ length: DOTS }, (_, at) => {
      const lit = Math.min(Math.max(through * DOTS - at, 0), 1);

      return (
        <View
          key={at}
          style={[
            styles.dot,
            { opacity: 0.3 + lit * 0.7, transform: [{ scale: 0.8 + lit * 0.2 }] },
          ]}
        />
      );
    })}
  </View>
);

const GapDots = memo(GapDotsRow);

GapDots.displayName = 'GapDots';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.space.sm, paddingVertical: tokens.space.md },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: '#ffffff' },
});

export { GapDots };
