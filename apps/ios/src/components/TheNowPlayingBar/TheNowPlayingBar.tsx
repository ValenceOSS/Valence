import { BookOpen, MusicNote } from '@keyline-icons/react-native';
import {
  FastForward as FastForwardFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  SkipForward as SkipForwardFilled,
} from '@keyline-icons/react-native/fill';
import { Image, StyleSheet, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { thePhonesAudiobookPlayer } from '@ValencePhone/books/thePhonesAudiobookPlayer';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { useTheBook } from '@ValencePhone/hooks/useTheBook';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheNowPlayingBarProps } from './TheNowPlayingBar.types';

const ART = 42;

const HIGH = 60;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 8,
    height: ART,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART,
  },
  cover: { width: ART / 1.5 },
  button: { padding: 8 },
  fills: { height: '100%', width: '100%' },
  opens: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, height: HIGH, paddingHorizontal: 10 },
  said: { flex: 1, gap: 1 },
});

/**
 * What is playing, kept above the tabs while music plays, as the web keeps its now-playing bar at
 * the foot of every page: the album's cover, the track and who it is by, a way to pause it and a way
 * to skip it. Pressing anywhere else opens the player. While the music plays on another device,
 * it says which, and its buttons drive that device.
 *
 * Where a book is the one being heard it shows the book instead: its cover, its title and who wrote
 * it, a way to pause it and a way to go on thirty seconds.
 *
 * Draws nothing while nothing is playing.
 *
 * @param onOpen - Told which is being heard when somebody wants the whole player.
 */
const TheNowPlayingBar = ({ onOpen }: TheNowPlayingBarProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const book = useTheBook();
  const heard = useWhatIsHeard(thePhonesAudiobookPlayer(), thePhonesMusicPlayer());
  const shown = useWhatIsPlaying(state);
  const isPlaying = shown?.isPlaying ?? state.isPlaying;
  const track = state.current;
  const listening = book.state.book;

  if (heard === 'book' && listening !== null) {
    return (
      <View style={styles.row}>
        <AGlass roundness={16} />

        <View style={styles.opens}>
          <Button
            tone="bare"
            label="Open the player"
            onPress={() => {
              onOpen('book');
            }}
          >
            <View style={[styles.row, { paddingHorizontal: 0 }]}>
              <View style={[styles.art, styles.cover, { backgroundColor: colours.surfaceRaised }]}>
                {listening.hasCover ? (
                  <Image
                    style={styles.fills}
                    source={{ uri: onThisServer(bookCoverUrl(listening.id)) }}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <Icon of={BookOpen} size={20} colour={colours.textMuted} />
                )}
              </View>

              <View style={styles.said}>
                <Words lines={1}>{listening.title}</Words>
                <Words size="small" tone="muted" lines={1}>
                  {listening.authors?.join(', ') ?? ''}
                </Words>
              </View>
            </View>
          </Button>
        </View>

        <Button
          tone="bare"
          label={book.state.isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            book.player.toggle();
          }}
        >
          <View style={styles.button}>
            <Icon
              of={book.state.isPlaying ? PauseFilled : PlayFilled}
              size={24}
              colour={colours.text}
            />
          </View>
        </Button>

        <Button
          tone="bare"
          label={`On ${LISTENING_CHOICES.forwardSeconds.toString()} seconds`}
          onPress={() => {
            book.player.skip(LISTENING_CHOICES.forwardSeconds);
          }}
        >
          <View style={styles.button}>
            <Icon of={FastForwardFilled} size={24} colour={colours.text} />
          </View>
        </Button>
      </View>
    );
  }

  if (track === null) {
    return null;
  }

  return (
    <View style={styles.row}>
      <AGlass roundness={16} />

      <View style={styles.opens}>
        <Button
          tone="bare"
          label="Open the player"
          onPress={() => {
            onOpen('music');
          }}
        >
          <View style={[styles.row, { paddingHorizontal: 0 }]}>
            <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
              {track.album.hasArtwork ? (
                <Image
                  style={styles.fills}
                  source={{ uri: onThisServer(albumArtworkUrl(track.album.id)) }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon of={MusicNote} size={20} colour={colours.textMuted} />
              )}
            </View>

            <View style={styles.said}>
              <Words lines={1}>{track.title}</Words>
              <Words size="small" tone="muted" lines={1}>
                {state.remote === null
                  ? track.artists.map((artist) => artist.name).join(', ')
                  : `Playing on ${state.remote.label}`}
              </Words>
            </View>
          </View>
        </Button>
      </View>

      <Button tone="bare" label={isPlaying ? 'Pause' : 'Play'} onPress={() => player.toggle()}>
        <View style={styles.button}>
          <Icon of={isPlaying ? PauseFilled : PlayFilled} size={24} colour={colours.text} />
        </View>
      </Button>

      <Button tone="bare" label="Next" onPress={() => player.next()}>
        <View style={styles.button}>
          <Icon of={SkipForwardFilled} size={24} colour={colours.text} />
        </View>
      </Button>
    </View>
  );
};

TheNowPlayingBar.displayName = 'TheNowPlayingBar';

export { TheNowPlayingBar };
