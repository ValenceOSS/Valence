import { BookOpen, LaptopSmartphone, Volume } from '@keyline-icons/react-native';
import {
  FastForward as FastForwardFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  LaptopSmartphone as LaptopSmartphoneFilled,
} from '@keyline-icons/react-native/fill';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { ADevicesSheet } from '@ValenceMobile/components/ADevicesSheet/ADevicesSheet';
import { ABookProgress } from './components/ABookProgress/ABookProgress';
import { ASongProgress } from './components/ASongProgress/ASongProgress';
import { AMarquee } from '@ValenceMobile/components/AMarquee/AMarquee';
import { ASwipedTitle } from './components/ASwipedTitle/ASwipedTitle';
import { AFadingCover } from './components/AFadingCover/AFadingCover';
import { currentOf, nextIn, previousIn } from '@ValenceClient/music/playQueue';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import { tintOf } from './tintOf';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
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
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { TheNowPlayingBarProps } from './TheNowPlayingBar.types';
import { say } from '@ValenceI18n/say';

const ART = 42;

const HIGH = 60;

const ART_ROUND = 8;

const ROUND = 16;

const GOES_PAST = 36;

const TURNS_PAST = 48;

const TURNS_FASTER_THAN = 0.5;

const GIVES_UP_MS = 2500;

const GOES_OFF_BY = 96;

const GOES_FASTER_THAN = 0.6;

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
    paddingHorizontal: 10,
  },
  flush: { paddingHorizontal: 0 },
  room: { height: HIGH },
  device: { alignItems: 'center', flexDirection: 'row', gap: 4 },
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
  const queue = state.queue;
  const moved = queue === null ? null : nextIn(queue, true);
  const after = moved === null ? null : currentOf(moved);
  const before = queue === null || queue.at === 0 ? null : currentOf(previousIn(queue));
  const [stripWidth, setStripWidth] = useState(0);
  const swiped = useRef(false);
  const trackId = track?.id ?? null;
  const lastTrack = useRef(trackId);
  const tint = tintOf(
    usePictureLights(
      track !== null && track.album.hasArtwork
        ? onThisServer(albumArtworkUrl(track.album.id))
        : null,
    ),
  );
  const listening = book.state.book;
  const isBook = heard === 'book' && listening !== null;
  const isStill = usePrefersStillness();
  const isPaused = isBook ? !book.state.isPlaying : track !== null && !isPlaying;
  const [slid] = useState(() => new Animated.Value(0));
  const [isChoosingDevice, setIsChoosingDevice] = useState(false);
  const [latest] = useState(
    () =>
      new Map<
        'now',
        {
          isPaused: boolean;
          isBook: boolean;
          isStill: boolean;
          width: number;
          hasNext: boolean;
          hasPrevious: boolean;
          letGo: () => void;
          next: () => void;
          previous: () => void;
        }
      >(),
  );
  const [shift] = useState(() => new Animated.Value(0));
  const [way] = useState(() => new Map<'now', 'skip' | 'dismiss'>());

  useEffect(() => {
    latest.set('now', {
      isPaused,
      isBook,
      isStill,
      width: stripWidth,
      hasNext: after !== null,
      hasPrevious: before !== null,
      next: () => {
        player.next();
      },
      previous: () => {
        player.previous();
      },
      letGo: isBook
        ? () => {
            book.player.close();
          }
        : () => {
            player.stop();
          },
    });
  });

  useEffect(() => {
    if (trackId === lastTrack.current) {
      return;
    }

    lastTrack.current = trackId;

    if (swiped.current || isStill || stripWidth === 0) {
      swiped.current = false;
      shift.setValue(0);

      return;
    }

    shift.setValue(stripWidth);
    Animated.spring(shift, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
  }, [trackId, isStill, stripWidth, shift]);

  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        const now = latest.get('now');
        const isSideways =
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2;
        const isDown = gesture.dy > 10 && gesture.dy > Math.abs(gesture.dx) * 2;

        if (isSideways && now?.isBook === false) {
          way.set('now', 'skip');

          return true;
        }

        if (isDown && now?.isPaused === true) {
          way.set('now', 'dismiss');

          return true;
        }

        return false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        if (way.get('now') === 'skip') {
          shift.setValue(gesture.dx);
        } else {
          slid.setValue(Math.max(0, gesture.dy));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const now = latest.get('now');

        if (now === undefined) {
          return;
        }

        if (way.get('now') === 'skip') {
          const toward =
            gesture.dx < -TURNS_PAST || gesture.vx < -TURNS_FASTER_THAN
              ? -1
              : gesture.dx > TURNS_PAST || gesture.vx > TURNS_FASTER_THAN
                ? 1
                : 0;

          const isPossible = toward < 0 ? now.hasNext : now.hasPrevious;

          if (toward === 0 || now.width === 0 || !isPossible) {
            Animated.spring(shift, {
              ...SPRINGS.liquid,
              toValue: 0,
              useNativeDriver: true,
            }).start();

            return;
          }

          const moveOn = toward < 0 ? now.next : now.previous;

          if (now.isStill) {
            shift.setValue(0);
            moveOn();

            return;
          }

          Animated.timing(shift, {
            toValue: toward * now.width,
            duration: GOES_OFF_MS,
            useNativeDriver: true,
          }).start(() => {
            swiped.current = true;
            moveOn();
            setTimeout(() => {
              if (swiped.current) {
                swiped.current = false;
                Animated.spring(shift, {
                  ...SPRINGS.liquid,
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              }
            }, GIVES_UP_MS);
          });

          return;
        }

        const isGoing = gesture.dy > GOES_PAST || gesture.vy > GOES_FASTER_THAN;

        if (!isGoing) {
          Animated.spring(slid, BACK).start();

          return;
        }

        Animated.timing(slid, {
          toValue: GOES_OFF_BY,
          duration: GOES_OFF_MS,
          useNativeDriver: true,
        }).start(() => {
          now.letGo();
          slid.setValue(0);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(shift, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
        Animated.spring(slid, BACK).start();
      },
    }),
  );
  const moving = useMemo(
    () => ({
      opacity: slid.interpolate({
        inputRange: [0, GOES_OFF_BY],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
      transform: [{ translateY: slid }],
    }),
    [slid],
  );

  if (isRoomOnly) {
    return isBook || track !== null ? <View style={styles.room} /> : null;
  }

  if (isBook) {
    return (
      <Animated.View style={[styles.row, moving]} {...swipe.panHandlers}>
        <AGlass roundness={ROUND} />

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

  /**
   * A song as the bar writes it: its name over its artists playing here, or both on one line playing
   * on another device, where the device takes the second line.
   *
   * @param song - The song.
   * @returns How it is written.
   */
  const wordsOf = (song: MusicTrack) => {
    const artists = song.artists.map((artist) => artist.name).join(', ');

    return state.remote === null ? (
      <>
        <AMarquee key={`title-${song.id}`}>
          <Words lines={1}>{song.title}</Words>
        </AMarquee>
        <AMarquee key={`artists-${song.id}`}>
          <Words size="small" tone="muted" lines={1}>
            {artists}
          </Words>
        </AMarquee>
      </>
    ) : (
      <AMarquee key={`both-${song.id}`}>
        <Words lines={1}>
          {song.title}
          <Words tone="muted">{say('phone.theNowPlayingBar.byArtists', { artists })}</Words>
        </Words>
      </AMarquee>
    );
  };

  if (track === null) {
    return null;
  }

  return (
    <Animated.View style={[styles.row, moving]} {...swipe.panHandlers}>
      <AGlass
        roundness={ROUND}
        {...(tint === null
          ? {}
          : { tint: Platform.OS === 'ios' ? withAlpha(tint, 0.55) : withAlpha(tint, 0.96) })}
      />

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
              <AFadingCover
                uri={track.album.hasArtwork ? onThisServer(albumArtworkUrl(track.album.id)) : null}
              />
            </View>

            <View style={styles.said}>
              <ASwipedTitle
                shift={shift}
                onWidth={setStripWidth}
                previous={before === null ? null : wordsOf(before)}
                current={wordsOf(track)}
                next={after === null ? null : wordsOf(after)}
              />
              {state.remote === null ? null : (
                <View style={styles.device}>
                  <Icon of={Volume} size={14} colour={colours.accent} />
                  <Words size="small" tone="accent" lines={1}>
                    {state.remote.label}
                  </Words>
                </View>
              )}
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
            of={state.remote === null ? LaptopSmartphone : LaptopSmartphoneFilled}
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
    </Animated.View>
  );
};

TheNowPlayingBar.displayName = 'TheNowPlayingBar';

export { TheNowPlayingBar };
