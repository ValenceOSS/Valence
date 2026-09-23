import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { PlayingBars } from '@ValenceTv/components/PlayingBars/PlayingBars';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TrackRowProps } from './TrackRow.types';

/**
 * One song in a list of them: where it comes in the list, or bars rising and falling where it is
 * the one playing, its name and who sings it, the album it is from where the list is not one album, and how
 * long it is. The remote lands on the whole row, which turns white.
 *
 * @param track - The song.
 * @param place - Where it comes in the list, counting from nought.
 * @param isCurrent - Whether it is the song playing now.
 * @param isPlaying - Whether the music is playing rather than paused.
 * @param showsAlbum - Whether to say which album it is from.
 * @param onPress - Told where in the list the chosen song comes.
 * @param onFocus - Told where in the list the song the remote is on comes.
 */
const TrackRowLine = ({
  track,
  place,
  isCurrent,
  isPlaying,
  showsAlbum = false,
  onPress,
  onFocus,
}: TrackRowProps) => (
  <Focusable
    label={`${track.title}, ${track.artists.map((artist) => artist.name).join(', ')}`}
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
              {track.title}
            </Text>
            <Text numberOfLines={1} style={[styles.artists, { color: quiet }]}>
              {track.isExplicit ? 'E · ' : ''}
              {track.artists.map((artist) => artist.name).join(', ')}
            </Text>
          </View>

          {showsAlbum ? (
            <Text numberOfLines={1} style={[styles.album, { color: quiet }]}>
              {track.album.title}
            </Text>
          ) : null}

          <Text style={[styles.length, { color: quiet }]}>
            {formatDuration(track.durationSeconds)}
          </Text>
        </View>
      );
    }}
  </Focusable>
);

const TrackRow = memo(TrackRowLine);

TrackRow.displayName = 'TrackRow';

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
  artists: { fontSize: tokens.type.small },
  album: { flex: 1, fontSize: tokens.type.small },
  length: {
    width: 100,
    textAlign: 'right',
    fontSize: tokens.type.small,
    fontVariant: ['tabular-nums'],
  },
});

export { TrackRow };
