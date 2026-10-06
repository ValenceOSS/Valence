import { BookOpen, LaptopSmartphone, MusicNote } from '@keyline-icons/react-native';
import {
  FastForward as FastForwardFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  SkipForward as SkipForwardFilled,
} from '@keyline-icons/react-native/fill';
import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { ADevicesSheet } from '@ValenceMobile/components/ADevicesSheet/ADevicesSheet';
import { ABookProgress } from './components/ABookProgress/ABookProgress';
import { ASongProgress } from './components/ASongProgress/ASongProgress';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useTheBook } from '@ValenceMobile/hooks/useTheBook';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { TheNowPlayingBarProps } from './TheNowPlayingBar.types';
import { say } from '@ValenceI18n/say';

const ART = 42;

const HIGH = 60;

const ART_ROUND = 14;

const GOES_PAST = 0.35;

const GOES_FASTER_THAN = 0.8;

const GOES_OFF_MS = 180;

const BACK = { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: ART_ROUND,
    height: ART,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART,
  },
  cover: { width: ART / 1.5 },
  button: { padding: 8 },
  fills: { height: '100%', width: '100%' },
  opens: { flex: 1 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: HIGH,
    paddingLeft: (HIGH - ART) / 2,
    paddingRight: 14,
  },
  flush: { paddingLeft: 0, paddingRight: 0 },
  room: { height: HIGH },
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
 * While it is paused it can be swiped away to either side, which stops the music or closes the
 * book, as a paused player on the lock screen can be; while it plays it stays where it is.
 *
 * Draws nothing while nothing is playing.
 *
 * @param onOpen - Told which is being heard when somebody wants the whole player.
 * @param isRoomOnly - Whether to keep only the room the bar takes, for a player drawn over it.
 */
const TheNowPlayingBar = ({ onOpen, isRoomOnly = false }: TheNowPlayingBarProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const book = useTheBook();
  const heard = useWhatIsHeard(thePhonesAudiobookPlayer(), thePhonesMusicPlayer());
  const shown = useWhatIsPlaying(state);
  const isPlaying = shown?.isPlaying ?? state.isPlaying;
  const track = state.current;
  const listening = book.state.book;
  const across = useWindowDimensions().width;
  const isBook = heard === 'book' && listening !== null;
  const isPaused = isBook ? !book.state.isPlaying : track !== null && !isPlaying;
  const [slid] = useState(() => new Animated.Value(0));
  const [isChoosingDevice, setIsChoosingDevice] = useState(false);
  const [latest] = useState(
    () => new Map<'now', { isPaused: boolean; across: number; letGo: () => void }>(),
  );

  useEffect(() => {
    latest.set('now', {
      isPaused,
      across,
      letGo: isBook
        ? () => {
            book.player.close();
          }
        : () => {
            player.stop();
          },
    });
  });

  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        latest.get('now')?.isPaused === true &&
        Math.abs(gesture.dx) > 10 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderMove: (_, gesture) => {
        slid.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const now = latest.get('now');

        if (now === undefined) {
          return;
        }

        const { across: wide, letGo } = now;
        const isGoing =
          Math.abs(gesture.dx) > wide * GOES_PAST || Math.abs(gesture.vx) > GOES_FASTER_THAN;

        if (!isGoing) {
          Animated.spring(slid, BACK).start();

          return;
        }

        Animated.timing(slid, {
          toValue: (gesture.dx === 0 ? Math.sign(gesture.vx) : Math.sign(gesture.dx)) * wide,
          duration: GOES_OFF_MS,
          useNativeDriver: true,
        }).start(() => {
          letGo();
          slid.setValue(0);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(slid, BACK).start();
      },
    }),
  );
  const moving = useMemo(
    () => ({
      opacity: slid.interpolate({
        inputRange: [-across, 0, across],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
      }),
      transform: [{ translateX: slid }],
    }),
    [slid, across],
  );

  if (isRoomOnly) {
    return isBook || track !== null ? <View style={styles.room} /> : null;
  }

  if (isBook) {
    return (
      <Animated.View style={[styles.row, moving]} {...swipe.panHandlers}>
        <AGlass roundness={HIGH / 2} />

        <View style={styles.opens}>
          <Button
            tone="bare"
            label={say('common.openThePlayer')}
            onPress={() => {
              onOpen('book');
            }}
          >
            <View style={[styles.row, styles.flush]}>
              <View style={[styles.art, styles.cover, { backgroundColor: colours.surfaceRaised }]}>
                {listening.hasCover ? (
                  <ARemotePicture
                    style={styles.fills}
                    uri={onThisServer(bookCoverUrl(listening.id))}
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
                <ABookProgress />
              </View>
            </View>
          </Button>
        </View>

        <Button
          tone="bare"
          label={book.state.isPlaying ? say('common.pause') : say('common.play')}
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
          label={say('common.onForwardSecondsSeconds', {
            forwardSeconds: LISTENING_CHOICES.forwardSeconds.toString(),
          })}
          onPress={() => {
            book.player.skip(LISTENING_CHOICES.forwardSeconds);
          }}
        >
          <View style={styles.button}>
            <Icon of={FastForwardFilled} size={24} colour={colours.text} />
          </View>
        </Button>
      </Animated.View>
    );
  }

  if (track === null) {
    return null;
  }

  return (
    <Animated.View style={[styles.row, moving]} {...swipe.panHandlers}>
      <AGlass roundness={HIGH / 2} />

      <View style={styles.opens}>
        <Button
          tone="bare"
          label={say('common.openThePlayer')}
          onPress={() => {
            onOpen('music');
          }}
        >
          <View style={[styles.row, styles.flush]}>
            <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
              {track.album.hasArtwork ? (
                <ARemotePicture
                  style={styles.fills}
                  uri={onThisServer(albumArtworkUrl(track.album.id))}
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
                  : say('common.playingOnLabel', { label: state.remote.label })}
              </Words>
              <ASongProgress />
            </View>
          </View>
        </Button>
      </View>

      <Button
        tone="bare"
        label={say('common.playOnAnotherDevice')}
        onPress={() => {
          setIsChoosingDevice(true);
        }}
      >
        <View style={styles.button}>
          <Icon
            of={LaptopSmartphone}
            size={22}
            colour={state.remote === null ? colours.text : colours.accent}
          />
        </View>
      </Button>

      <ADevicesSheet
        isOpen={isChoosingDevice}
        onClose={() => {
          setIsChoosingDevice(false);
        }}
      />

      <Button
        tone="bare"
        label={isPlaying ? say('common.pause') : say('common.play')}
        onPress={() => player.toggle()}
      >
        <View style={styles.button}>
          <Icon of={isPlaying ? PauseFilled : PlayFilled} size={24} colour={colours.text} />
        </View>
      </Button>

      <Button tone="bare" label={say('common.next')} onPress={() => player.next()}>
        <View style={styles.button}>
          <Icon of={SkipForwardFilled} size={24} colour={colours.text} />
        </View>
      </Button>
    </Animated.View>
  );
};

TheNowPlayingBar.displayName = 'TheNowPlayingBar';

export { TheNowPlayingBar };
