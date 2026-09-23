import { memo, useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { tokens } from '@ValenceTv/theme/tokens';
import type { LyricLineProps } from './LyricLine.types';

const SETTLES_MS = 420;

const SUNG = 1;

const NEXT = 0.62;

const JUST_GONE = 0.4;

const DIMS_BY = 0.1;

const FAINTEST = 0.12;

/**
 * One line of the words, lit while it is sung and dimmed either side of it, the more the further it
 * is from the sung one — the lines to come a little brighter than those gone — easing from one to
 * the other as the song moves on. Where the
 * words are timed, landing on a line and pressing it goes to where it is sung.
 *
 * @param text - The words.
 * @param distance - How many lines it is from the one sung now: nought for that one, less than
 *   nought for lines gone.
 * @param canSeek - Whether pressing it goes to where it is sung.
 * @param onPress - Told when it is pressed.
 * @param onFocus - Told when the remote lands on it.
 * @param onLayout - Told where it sits in the column and how tall it is.
 */
const LyricLineText = ({ text, distance, canSeek, onPress, onFocus, onLayout }: LyricLineProps) => {
  const target =
    distance === 0
      ? SUNG
      : Math.max((distance > 0 ? NEXT : JUST_GONE) - (Math.abs(distance) - 1) * DIMS_BY, FAINTEST);
  const [shown] = useState(() => new Animated.Value(target));

  useEffect(() => {
    Animated.timing(shown, {
      toValue: target,
      duration: SETTLES_MS,
      useNativeDriver: true,
    }).start();
  }, [shown, target]);

  return (
    <View
      collapsable={false}
      style={styles.line}
      onLayout={(event) => {
        onLayout(event.nativeEvent.layout.y, event.nativeEvent.layout.height);
      }}
    >
      <Focusable label={text} scale={1} {...(canSeek ? { onPress } : {})} onFocus={onFocus}>
        {(isFocused) => (
          <Animated.Text
            style={[
              styles.words,
              {
                opacity: isFocused ? 1 : shown,
                transform: [
                  {
                    scale: shown.interpolate({
                      inputRange: [FAINTEST, SUNG],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
              isFocused && styles.focused,
            ]}
          >
            {text}
          </Animated.Text>
        )}
      </Focusable>
    </View>
  );
};

const LyricLine = memo(LyricLineText);

LyricLine.displayName = 'LyricLine';

const styles = StyleSheet.create({
  line: { alignSelf: 'stretch' },
  words: {
    color: '#ffffff',
    fontSize: 56,
    lineHeight: 70,
    fontWeight: '800',
    transformOrigin: 'left center',
    paddingVertical: tokens.space.sm,
  },
  focused: { textDecorationLine: 'underline' },
});

export { LyricLine };
