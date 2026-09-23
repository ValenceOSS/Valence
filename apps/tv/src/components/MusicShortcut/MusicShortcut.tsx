import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicShortcutProps } from './MusicShortcut.types';

const HEIGHT = 96;

/**
 * A way straight back to something played a lot, as the front of the music section lays them out
 * in a grid: its picture at the left and its name beside it on a quiet panel, ringed in white while
 * the remote is on it.
 *
 * @param item - What it opens.
 * @param width - How wide it is, for a row of them to fill the screen.
 * @param onPress - Told when it is chosen.
 * @param onFocus - Told when the remote lands on it.
 * @param ref - Handed the shortcut, for the remote to be sent to it.
 * @param hasPreferredFocus - Whether the remote starts here.
 */
const MusicShortcutPanel = ({
  item,
  width,
  onPress,
  onFocus,
  ref,
  hasPreferredFocus = false,
}: MusicShortcutProps) => (
  <Focusable
    ref={ref}
    label={item.title}
    scale={1.04}
    hasPreferredFocus={hasPreferredFocus}
    onPress={() => {
      onPress(item);
    }}
    {...(onFocus === undefined
      ? {}
      : {
          onFocus: () => {
            onFocus(item);
          },
        })}
  >
    {(isFocused) => (
      <View style={[styles.panel, { width }, isFocused && styles.focused]}>
        <MusicCover kind={item.kind} art={item.art} size={HEIGHT} isUrgent style={styles.cover} />

        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
      </View>
    )}
  </Focusable>
);

const MusicShortcut = memo(MusicShortcutPanel);

MusicShortcut.displayName = 'MusicShortcut';

const styles = StyleSheet.create({
  panel: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    borderRadius: tokens.radii.md,
    borderWidth: tokens.FOCUS_RING,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  focused: { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.16)' },
  cover: { borderRadius: 0 },
  title: {
    flex: 1,
    paddingRight: tokens.space.md,
    color: tokens.colours.text,
    fontSize: tokens.type.body - 2,
    fontWeight: '700',
  },
});

export { MusicShortcut };
