import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { PlayingBars } from '@ValenceTv/components/PlayingBars/PlayingBars';
import { tokens } from '@ValenceTv/theme/tokens';
import type { NumberedRowProps } from './NumberedRow.types';

/**
 * One line in a numbered list of things to hear — a song, a chapter: where it comes in the list,
 * or bars rising and falling where it is the one playing, its name with a line beneath it, anything
 * said beside it, and how long it is. The remote lands on the whole row, which turns white.
 *
 * @param label - What it is read out as.
 * @param title - Its name.
 * @param detail - The line beneath its name, where it has one.
 * @param aside - What is said beside it, before its length, where anything is.
 * @param length - How long it lasts, in seconds.
 * @param place - Where it comes in the list, counting from nought.
 * @param isCurrent - Whether it is the one playing now.
 * @param isPlaying - Whether what is playing is playing rather than paused.
 * @param onPress - Told where in the list the chosen line comes.
 * @param onFocus - Told where in the list the line the remote is on comes.
 */
const NumberedRowLine = ({
  label,
  title,
  detail,
  aside,
  length,
  place,
  isCurrent,
  isPlaying,
  onPress,
  onFocus,
}: NumberedRowProps) => (
  <Focusable
    label={label}
    scale={1}
    onPress={() => {
      onPress(place);
    }}
    {...(onFocus === undefined
      ? {}
      : {
          onFocus: () => {
            onFocus(place);
          },
        })}
  >
    {(isFocused) => {
      const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;
      const quiet = isFocused ? tokens.colours.onWhite : tokens.colours.muted;

      return (
        <View style={[styles.row, isFocused && styles.focused]}>
          <View style={styles.place}>
            {isCurrent ? (
              <PlayingBars isPlaying={isPlaying} colour={isPlaying || isFocused ? ink : quiet} />
            ) : (
              <Text style={[styles.number, { color: quiet }]}>{place + 1}</Text>
            )}
          </View>

          <View style={styles.words}>
            <Text numberOfLines={1} style={[styles.title, { color: ink }]}>
              {title}
            </Text>
            {detail === undefined ? null : (
              <Text numberOfLines={1} style={[styles.detail, { color: quiet }]}>
                {detail}
              </Text>
            )}
          </View>

          {aside === undefined ? null : (
            <Text numberOfLines={1} style={[styles.aside, { color: quiet }]}>
              {aside}
            </Text>
          )}

          <Text style={[styles.length, { color: quiet }]}>{formatDuration(length)}</Text>
        </View>
      );
    }}
  </Focusable>
);

const NumberedRow = memo(NumberedRowLine);

NumberedRow.displayName = 'NumberedRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.lg,
  },
  focused: { backgroundColor: '#ffffff' },
  place: { width: 48, alignItems: 'center' },
  number: { fontSize: tokens.type.body, fontVariant: ['tabular-nums'] },
  words: { flex: 2, gap: 2 },
  title: { fontSize: tokens.type.body, fontWeight: '600' },
  detail: { fontSize: tokens.type.small },
  aside: { flex: 1, fontSize: tokens.type.small },
  length: {
    width: 100,
    textAlign: 'right',
    fontSize: tokens.type.small,
    fontVariant: ['tabular-nums'],
  },
});

export { NumberedRow };
