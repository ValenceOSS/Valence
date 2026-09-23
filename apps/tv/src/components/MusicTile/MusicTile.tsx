import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicTileProps } from './MusicTile.types';

const SIZE = 260;

/**
 * Something to listen to on a shelf — an album, an artist, a playlist — its picture lifting as the
 * remote lands on it, with its name and what it is beneath.
 *
 * @param item - What it is.
 * @param onPress - Told when it is chosen.
 * @param onFocus - Told when the remote lands on it.
 * @param isUrgent - Whether its picture is fetched ahead of the others'.
 * @param size - How wide its picture is.
 */
const MusicTileCard = ({
  item,
  onPress,
  onFocus,
  isUrgent = false,
  size = SIZE,
}: MusicTileProps) => (
  <Focusable
    label={`${item.title}, ${item.detail}`}
    shadow={{
      height: size,
      cornerRadius: item.kind === 'artist' ? size / 2 : tokens.radii.lg,
    }}
    scale={1.1}
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
    <View style={{ width: size }}>
      <MusicCover kind={item.kind} art={item.art} size={size} isUrgent={isUrgent} />

      <Text numberOfLines={1} style={[styles.title, item.kind === 'artist' && styles.middle]}>
        {item.title}
      </Text>
      <Text numberOfLines={1} style={[styles.detail, item.kind === 'artist' && styles.middle]}>
        {item.detail}
      </Text>
    </View>
  </Focusable>
);

const MusicTile = memo(MusicTileCard);

MusicTile.displayName = 'MusicTile';

const styles = StyleSheet.create({
  title: {
    marginTop: tokens.space.md,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.small - 2 },
  middle: { textAlign: 'center' },
});

export { MusicTile };
