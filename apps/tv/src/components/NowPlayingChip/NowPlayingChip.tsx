import { StyleSheet, Text, View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { PlayingBars } from '@ValenceTv/components/PlayingBars/PlayingBars';
import { tokens } from '@ValenceTv/theme/tokens';
import type { NowPlayingChipProps } from './NowPlayingChip.types';

const COVER = 56;

const WIDTH = 380;

/**
 * What is playing, kept in the corner of every page while somebody browses, as the television's
 * music apps keep it: the song's cover, its name and who sings it, on the same glass as the bar,
 * with bars rising and falling while it plays and resting while it does not. Landing on it and pressing
 * opens what is playing. Nothing is drawn while nothing plays.
 *
 * @param onOpen - Told when it is chosen.
 * @param ref - Handed the chip, for the remote to be sent to it.
 */
const NowPlayingChip = ({ onOpen, ref }: NowPlayingChipProps) => {
  const { state } = useMusicPlayer(theMusicPlayer());
  const shown = useWhatIsPlaying(state);

  if (shown === null) {
    return null;
  }

  return (
    <Glass cornerRadius={tokens.radii.round} style={styles.glass}>
      <Focusable ref={ref} label={`Now playing: ${shown.title}`} scale={1.06} onPress={onOpen}>
        {(isFocused) => (
          <View style={[styles.chip, isFocused && styles.focused]}>
            <MusicCover
              kind="album"
              art={shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null}
              size={COVER}
              style={styles.cover}
            />

            <View style={styles.words}>
              <Text
                numberOfLines={1}
                style={[styles.title, isFocused && { color: tokens.colours.onWhite }]}
              >
                {shown.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.artists, isFocused && { color: tokens.colours.onWhite }]}
              >
                {shown.artists.map((artist) => artist.name).join(', ')}
              </Text>
            </View>

            <PlayingBars
              isPlaying={shown.isPlaying}
              colour={isFocused ? tokens.colours.onWhite : tokens.colours.text}
            />
          </View>
        )}
      </Focusable>
    </Glass>
  );
};

NowPlayingChip.displayName = 'NowPlayingChip';

const styles = StyleSheet.create({
  glass: { borderRadius: tokens.radii.round },
  chip: {
    width: WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    padding: tokens.space.xs,
    paddingRight: tokens.space.md,
    borderRadius: tokens.radii.round,
  },
  focused: { backgroundColor: '#ffffff' },
  cover: { borderRadius: COVER / 2 },
  words: { flex: 1 },
  title: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '700' },
  artists: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
});

export { NowPlayingChip };
