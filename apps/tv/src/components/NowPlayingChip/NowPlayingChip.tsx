import { StyleSheet, Text, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
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
 * music apps keep it: the song's cover, its name and who sings it — or the book's cover, its title
 * and who wrote it, where a book is the one being heard — on the same glass as the bar, with bars
 * rising and falling while it plays and resting while it does not. Landing on it and pressing opens
 * what is playing. Nothing is drawn while nothing plays.
 *
 * @param onOpen - Told which is being heard when it is chosen.
 * @param ref - Handed the chip, for the remote to be sent to it.
 */
const NowPlayingChip = ({ onOpen, ref }: NowPlayingChipProps) => {
  const { state } = useMusicPlayer(theMusicPlayer());
  const reading = useAudiobookPlayer(theAudiobookPlayer(), { followsPosition: false }).state;
  const song = useWhatIsPlaying(state);
  const heard = useWhatIsHeard();
  const { book } = reading;
  const shown =
    heard === 'book' && book !== null
      ? {
          title: book.title,
          detail: book.authors?.join(', ') ?? '',
          isPlaying: reading.isPlaying,
          cover: (
            <View style={styles.cover}>
              {book.hasCover ? (
                <Artwork path={bookCoverUrl(book.id)} style={StyleSheet.absoluteFill} />
              ) : null}
            </View>
          ),
        }
      : song === null
        ? null
        : {
            title: song.title,
            detail: song.artists.map((artist) => artist.name).join(', '),
            isPlaying: song.isPlaying,
            cover: (
              <MusicCover
                kind="album"
                art={song.hasArtwork ? albumArtworkUrl(song.albumId) : null}
                size={COVER}
                style={styles.cover}
              />
            ),
          };

  if (shown === null || heard === null) {
    return null;
  }

  return (
    <Glass cornerRadius={tokens.radii.round} style={styles.glass}>
      <Focusable
        ref={ref}
        label={`Now playing: ${shown.title}`}
        scale={1.06}
        onPress={() => {
          onOpen(heard);
        }}
      >
        {(isFocused) => (
          <View style={[styles.chip, isFocused && styles.focused]}>
            {shown.cover}

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
                {shown.detail}
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
  cover: {
    width: COVER,
    height: COVER,
    borderRadius: COVER / 2,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  words: { flex: 1 },
  title: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '700' },
  artists: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
});

export { NowPlayingChip };
